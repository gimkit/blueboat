import jsonpatch from 'fast-json-patch'
import { NodeRedisPubSub } from 'node-redis-pubsub'
import { Server, Socket } from 'socket.io'
import SimpleClient from '../../types/SimpleClient'
import ClientActions from '../constants/ClientActions'
import { PLAYER_LEFT } from '../constants/PubSubListeners'
import { ROOM_STATE_PATCH_RATE } from '../constants/RoomConfig'
import ServerActions from '../constants/ServerActions'
import RedisClient from '../server/RedisClient'
import RoomFetcher from '../server/RoomFetcher'
import Client from './Client'
import Clock from './Clock'
import ClockManager from './ClockManager'

interface RoomOptions {
  io: Server
  roomId: string
  redis: RedisClient
  pubsub: NodeRedisPubSub
  owner: SimpleClient
  ownerSocket: Socket
  options: {}
  onRoomDisposed: (roomId: string) => void
  roomFetcher: RoomFetcher
}

class Room<State = any> {
  // Public values

  // @ts-ignore
  public state: State = {}
  public roomId: string
  public clients: Client[] = []
  public patchRate = ROOM_STATE_PATCH_RATE
  public options = {}
  public clock = new ClockManager()
  public metadata: any

  // Private room Helpers and Objects
  private io: Server

  private pubsub: NodeRedisPubSub
  // @ts-ignore
  private redis: RedisClient
  // @ts-ignore
  private ownerSocket: Socket
  private owner: SimpleClient
  private onRoomDisposed: (roomId: string) => void
  private roomFetcher: RoomFetcher

  /* tslint:disable */
  private _patchInterval: Clock
  private _gameMessagePubsub: any
  private _playerPubsub: any
  // @ts-ignore
  private _lastState: State = {}
  /* tslint:enable */

  constructor(options: RoomOptions) {
    this.roomId = options.roomId
    this.io = options.io
    this.pubsub = options.pubsub
    this.redis = options.redis
    this.owner = options.owner
    this.ownerSocket = options.ownerSocket
    this.onRoomDisposed = options.onRoomDisposed
    this.roomFetcher = options.roomFetcher
    if (options.options) {
      this.options = options.options
    }
    this.pubSubListener()
  }

  // API functions
  public onCreate?(options?: any): void
  public canClientJoin?(client: SimpleClient, options?: any): boolean
  public onJoin?(client: Client, options?: any): void
  public onMessage?(client: Client, key: string, data?: any): void
  public onLeave?(client: Client, intentional: boolean): void
  public beforePatch?(lastState: State): void
  public afterPatch?(lastState: State): void
  public onDispose?(): void

  public setState = (newState: State) => {
    this._lastState = newState
    this.state = newState
  }

  public broadcast = (key: string, data?: any) => {
    this.clients.forEach(client => client.send(key, data))
  }

  public setPatchRate = (patchRateInMilliseconds: number) => {
    if (!patchRateInMilliseconds) {
      return
    }
    this.patchRate = patchRateInMilliseconds
    if (this._patchInterval) {
      if (this._patchInterval) {
        this._patchInterval.dispose()
        this._patchInterval = undefined
      }
    }
    this._patchInterval = this.clock.setInterval(
      this._sendNewPatch,
      patchRateInMilliseconds
    )
  }

  public setMetadata = (newMetadata: any) => {
    this.roomFetcher
      .setRoomMetadata(this.roomId, newMetadata)
      .then(() => (this.metadata = newMetadata))
      .catch()
  }

  public dispose = async () => {
    try {
      await this.roomFetcher.removeRoom(this.roomId)
      this.onRoomDisposed(this.roomId)
      this._gameMessagePubsub()
      this._playerPubsub()
      if (this.onDispose) {
        await this.onDispose()
      }
    } catch (e) {
      throw e
    }
  }

  // tslint:disable-next-line
  private _sendNewPatch = () => {
    if (this.beforePatch) {
      this.beforePatch(this._lastState)
    }
    const lastState = JSON.parse(JSON.stringify(this._lastState))
    const currentState = JSON.parse(JSON.stringify(this.state))
    const patches = jsonpatch.compare(lastState, currentState)
    if (patches.length) {
      this.broadcast(ServerActions.statePatch, patches)
    }
    if (this.afterPatch) {
      this.afterPatch(this._lastState)
    }
    this._lastState = JSON.parse(JSON.stringify(this.state))
  }

  private onRoomCreated = () => {
    this.setPatchRate(this.patchRate)
  }

  private findFullClientFromSimpleClient = (simpleClient: SimpleClient) => {
    return this.clients.filter(
      client =>
        client.sessionId === simpleClient.sessionId && client.id === client.id
    )[0]
  }

  private addClient = (prejoinedClient: SimpleClient, options?: any) => {
    this.clients.push(
      new Client(
        this.roomId,
        prejoinedClient.id,
        prejoinedClient.sessionId,
        this.io,
        this.removeClient
      )
    )
    this.clientHasJoined(
      this.findFullClientFromSimpleClient(prejoinedClient),
      options
    )
  }

  private clientHasJoined = (client: Client, options?: any) => {
    client.send(ServerActions.joinedRoom)
    if (this.clients.length === 1) {
      this.onRoomCreated()
      if (this.onCreate) {
        this.onCreate(options)
      }
    }
    client.send(
      ServerActions.currentState,
      JSON.parse(JSON.stringify(this.state))
    )
    if (this.onJoin) {
      this.onJoin(client, options)
    }
  }

  private clientRequestsToJoin = (client: SimpleClient, options: any) => {
    if (this.canClientJoin) {
      return this.canClientJoin(client, options)
    }
    return true
  }

  private removeClient = (clientSessionId: string, intentional: boolean) => {
    const client = this.clients.filter(c => c.sessionId === clientSessionId)[0]
    if (!client) {
      return
    }
    client.send(ServerActions.removedFromRoom)
    this.clients = this.clients.filter(c => c !== client)
    if (this.onLeave) {
      this.onLeave(client, intentional)
    }
    if (client.sessionId === this.owner.sessionId) {
      this.clients.forEach(c => this.removeClient(c.sessionId, false))
      this.dispose()
        .then()
        .catch()
    }
  }

  private pubSubListener = () => {
    this._gameMessagePubsub = this.pubsub.on(this.roomId, (d: string) => {
      const payload = JSON.parse(d) as {
        action: string
        client: SimpleClient
        data?: any
      }
      if (!payload || !payload.action || !payload.client) {
        return
      }
      const { action, data, client } = payload
      if (action === ClientActions.joinRoom) {
        if (this.clientRequestsToJoin(client, data.options)) {
          this.addClient(client, data.options)
          return
        } else {
          this.io
            .to(client.sessionId)
            .emit(`${this.roomId}-error`, 'Not allowed to join room')
        }
      }
      if (action === ClientActions.sendMessage) {
        const roomClient = this.clients.filter(
          c => c.sessionId === payload.client.sessionId
        )[0]
        if (!roomClient) {
          return
        }
        if (this.onMessage) {
          this.onMessage(roomClient, payload.data.key, payload.data.data)
        }
      }
    })
    this._playerPubsub = this.pubsub.on(
      PLAYER_LEFT,
      (playerSessionId: string) => {
        const client = this.clients.filter(
          c => c.sessionId === playerSessionId
        )[0]
        if (!client) {
          return
        }
        this.removeClient(client.sessionId, false)
      }
    )
  }
}

export default Room
