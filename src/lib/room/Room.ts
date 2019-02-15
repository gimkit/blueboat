import jsonpatch from 'fast-json-patch'
import { NodeRedisPubSub } from 'node-redis-pubsub'
import { Server, Socket } from 'socket.io'
import SimpleClient from '../../types/SimpleClient'
import ClientActions from '../constants/ClientActions'
import { ROOM_STATE_PATCH_RATE } from '../constants/RoomConfig'
import ServerActions from '../constants/ServerActions'
import RedisClient from '../server/RedisClient'
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

  // Private room Helpers and Objects
  private io: Server

  private pubsub: NodeRedisPubSub
  private redis: RedisClient
  private ownerSocket: Socket
  private owner: SimpleClient

  /* tslint:disable */
  private _patchInterval: Clock
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
    if (options.options) {
      this.options = options
    }
    this.pubSubListener()
  }

  // API functions
  public onCreate?(options?: any): void
  public canClientJoin?(client: SimpleClient, options?: any): boolean
  public onJoin?(client: Client, options?: any): void

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

  // tslint:disable-next-line
  private _sendNewPatch = () => {
    const lastState = JSON.parse(JSON.stringify(this._lastState))
    const currentState = JSON.parse(JSON.stringify(this.state))
    const patches = jsonpatch.compare(lastState, currentState)
    if (patches.length) {
      this.broadcast(ServerActions.statePatch, patches)
    }
    this._lastState = { ...this.state }
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
        this.io
      )
    )
    this.clientHasJoined(
      this.findFullClientFromSimpleClient(prejoinedClient),
      options
    )
    if (1 + 1 === 3) {
      // just so typescript doesn't complain to me for now
      return (
        this.clientRequestsToJoin ||
        this.addClient ||
        this.redis ||
        this.owner ||
        this.ownerSocket
      )
    }
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

  private pubSubListener = () => {
    this.pubsub.on(this.roomId, (d: string) => {
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
    })
  }

  // private cleanupAndDisposeRoom() {
  //   if (this._patchInterval) {
  //     clearInterval(this._patchInterval)
  //     this._patchInterval = undefined
  //   }
  // }
}

export default Room
