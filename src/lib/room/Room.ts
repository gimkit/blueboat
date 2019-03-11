import { StateContainer } from '@gamestdio/state-listener'
import Clock, { Delayed } from '@gamestdio/timer'
import { NodeRedisPubSub } from 'node-redis-pubsub'
import { Server, Socket } from 'socket.io'
import SimpleClient from '../../types/SimpleClient'
import ClientActions from '../constants/ClientActions'
import { PLAYER_LEFT, REQUEST_INFO } from '../constants/PubSubListeners'
import { ROOM_STATE_PATCH_RATE } from '../constants/RoomConfig'
import ServerActions from '../constants/ServerActions'
import CustomGameValues from '../server/CustomGameValues'
import Emitter from '../server/Emitter'
import RedisClient from '../server/RedisClient'
import RoomFetcher from '../server/RoomFetcher'
import Client from './Client'

interface RoomOptions {
  io: Server
  roomId: string
  redis: RedisClient
  pubsub: NodeRedisPubSub
  owner: SimpleClient
  ownerSocket: Socket
  creatorOptions: any
  options: {}
  onRoomDisposed: (roomId: string) => void
  roomFetcher: RoomFetcher
  gameValues: CustomGameValues
  initialGameValues: any
  roomType: string
}

class Room<State = any> {
  // Public values

  // @ts-ignore
  public state: State = {}
  public initialGameValues: any = {}
  public roomId: string
  public clock = new Clock(true)
  public clients: Client[] = []
  public patchRate = ROOM_STATE_PATCH_RATE
  public options = {}
  public creatorOptions = {}
  public metadata: any
  public gameValues?: CustomGameValues
  public roomType: string
  public owner: SimpleClient

  // Private room Helpers and Objects
  private io: Server

  private pubsub: NodeRedisPubSub
  private stateContainer = new StateContainer({})
  // @ts-ignore
  private redis: RedisClient
  // @ts-ignore
  private ownerSocket: Socket
  private onRoomDisposed: (roomId: string) => void
  private roomFetcher: RoomFetcher
  private gameHostIsConnected = true
  /* tslint:disable */
  private _patchInterval: Delayed
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
    this.gameValues = options.gameValues
    this.roomType = options.roomType
    this.initialGameValues = options.initialGameValues
    if (options.options) {
      this.options = options.options
    }
    if (options.creatorOptions) {
      this.creatorOptions = options.creatorOptions
    }
    this.onRoomCreated()
    if (this.onCreate) {
      this.onCreate(options.options)
    }
    this.clock.setInterval(this.checkIfGameHostIsConnected, 10000)
    // Dispose room automatically in 2.5 hours
    this.clock.setTimeout(
      () =>
        this.dispose()
          .then()
          .catch(),
      1000 * 60 * 60 * 2.5
    )
    this.pubSubListener()
  }

  // API functions
  public onCreate?(options?: any): void
  public canClientJoin?(client: SimpleClient, options?: any): boolean
  public onJoin?(client: Client, options?: any): void
  public onMessage?(client: Client, key: string, data?: any): void
  public async onLeave?(client: Client, intentional: boolean): Promise<void>
  public beforePatch?(lastState: State): void
  public afterPatch?(lastState: State): void
  public beforeDispose?(): Promise<void>
  public onDispose?(): void

  public setState = (newState: State) => {
    this.stateContainer.set(JSON.parse(JSON.stringify(newState)))
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
        this._patchInterval.clear()
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
      if (this.beforeDispose) {
        await this.beforeDispose()
      }
      this.clock.stop()
      await this.roomFetcher.removeRoom(this.roomId)
      Emitter.removeListener(this.roomId, this._gameMessagePubsub)
      Emitter.removeListener(PLAYER_LEFT, this._playerPubsub)
      if (this.onDispose) {
        await this.onDispose()
      }
      this.onRoomDisposed(this.roomId)
    } catch (e) {
      throw e
    }
  }
  public allowReconnection = (client: Client, seconds: number) => {
    return new Promise<boolean>(resolve => {
      if (this.owner.id === client.id) {
        resolve(false)
      }
      this.clock.setTimeout(() => {
        const reconnected = this.clients.filter(c => c.id === client.id).length
          ? true
          : false
        resolve(reconnected)
      }, seconds * 1000)
    })
  }

  private checkIfGameHostIsConnected = () => {
    if (!this.gameHostIsConnected) {
      this.dispose()
        .then()
        .catch()
      return
    }
    this.gameHostIsConnected = false
    return
  }

  private listen = (client: Client, change: string) => {
    this.stateContainer.listen(
      change,
      dataChange => {
        if (this.clientExists(client.sessionId)) {
          client.send(ServerActions.statePatch, { change, patch: dataChange })
        }
      },
      true
    )
  }

  private clientExists = (sessionId: string) =>
    this.clients.map(c => c.sessionId).includes(sessionId)

  // tslint:disable-next-line
  private _sendNewPatch = () => {
    if (this.beforePatch) {
      this.beforePatch(this._lastState)
    }
    this.stateContainer.set(JSON.parse(JSON.stringify(this.state)))
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
    if (this.onJoin) {
      this.onJoin(client, options)
    }
  }

  private clientRequestsToJoin = (client: SimpleClient, options: any) => {
    // Two clients with the same ID are not allowed to join
    if (this.clients.filter(c => c.id === client.id).length) {
      return false
    }
    if (this.canClientJoin) {
      return this.canClientJoin(client, options)
    }
    return true
  }

  private removeClient = async (
    clientSessionId: string,
    intentional: boolean
  ) => {
    const client = this.clients.filter(c => c.sessionId === clientSessionId)[0]
    if (!client) {
      return
    }
    client.send(ServerActions.removedFromRoom)
    this.clients = this.clients.filter(c => c !== client)
    if (this.onLeave) {
      await this.onLeave(client, intentional)
    }
    if (client.sessionId === this.owner.sessionId) {
      this.dispose()
        .then(() =>
          this.clients.forEach(c => this.removeClient(c.sessionId, false))
        )
        .catch()
    }
  }

  private pubSubListener = () => {
    this._gameMessagePubsub = (d: string) => {
      if (!d) {
        return
      }
      const payload = JSON.parse(d) as {
        action: string
        client: SimpleClient
        data?: any
      }
      if (!payload || !payload.action) {
        return
      }
      if (payload.action === REQUEST_INFO) {
        this.pubsub.emit(
          REQUEST_INFO,
          JSON.stringify({ clients: this.clients, state: this.state })
        )
        return
      }
      if (!payload.client) {
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
        if (payload.data.key === ClientActions.listen) {
          this.listen(roomClient, payload.data.data)
          return
        }
        if (payload.data.key === ClientActions.ping) {
          this.gameHostIsConnected = true
          return
        }
        if (this.onMessage) {
          this.onMessage(roomClient, payload.data.key, payload.data.data)
        }
      }
    }

    this._playerPubsub = (playerSessionId: string) => {
      const client = this.clients.filter(
        c => c.sessionId === playerSessionId
      )[0]
      if (!client) {
        return
      }
      this.removeClient(client.sessionId, false)
        .then()
        .catch()
    }

    Emitter.addListener(this.roomId, this._gameMessagePubsub)
    Emitter.addListener(PLAYER_LEFT, this._playerPubsub)
  }
}

export default Room
