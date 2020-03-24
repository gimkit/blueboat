import Clock from '@gamestdio/timer'
import {serializeError} from 'serialize-error'
import { Server } from 'socket.io'
import SimpleClient from '../../types/SimpleClient'
import ClientActions from '../constants/ClientActions'
import { PLAYER_LEFT, REQUEST_INFO } from '../constants/PubSubListeners'
import ServerActions from '../constants/ServerActions'
import PubSub, { OnFunction } from '../pubsub/PubSub'
import CustomGameValues from '../server/CustomGameValues'
import Emitter from '../server/Emitter'
import RoomFetcher from '../server/RoomFetcher'
import Storage from '../storage/Storage'
import Callback from '../utils/Callback'
import Client from './Client'

interface RoomOptions {
  io: Server
  roomId: string
  storage: Storage
  pubsub: PubSub
  owner: SimpleClient
  creatorOptions: any
  options: {}
  onRoomDisposed: (roomId: string) => void
  roomFetcher: RoomFetcher
  gameValues: CustomGameValues
  initialGameValues: any
  roomType: string
  onRoomCreated: (error?: any) => void
}

class Room<State = any> {
  // Public values

  // @ts-ignore
  public state: State = {}
  public initialGameValues: any = {}
  public roomId: string
  public clock = new Clock(true)
  public clients: Client[] = []
  public options = {} as any
  public creatorOptions = {} as any
  public metadata: any
  public gameValues?: CustomGameValues
  public roomType: string
  public owner: SimpleClient

  public listeners = {
    onJoin: new Callback(),
    onLeave: new Callback()
  }

  // Private room Helpers and Objects
  private io: Server

  private pubsub: PubSub
  // @ts-ignore
  private storage: Storage
  private onRoomDisposed: (roomId: string) => void
  private roomFetcher: RoomFetcher
  private disposing: boolean = false
  /* tslint:disable */
  private _gameMessagePubsub: ReturnType<OnFunction>
  private _playerPubsub: any
  // @ts-ignore
  private _lastState: State = {}
  /* tslint:enable */

  constructor(options: RoomOptions) {
    this.roomId = options.roomId
    this.io = options.io
    this.pubsub = options.pubsub
    this.storage = options.storage
    this.owner = options.owner
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

    const roomCreated = (error?: any) => {
      options.onRoomCreated(error)
      this.onRoomCreated()
      if (error) {
        // @ts-ignore
        this.dispose().catch((e: any) => false)
      }
    }

    if (this.onCreate) {
      this.onCreate(options.options)
        .then(() => roomCreated())
        .catch(e => roomCreated(e))
    } else {
      roomCreated()
    }
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
  public async onCreate?(options?: any): Promise<void>
  public async canClientJoin?(
    client: SimpleClient,
    options?: any
  ): Promise<void>
  public onJoin?(client: Client, options?: any): void
  public onMessage?(client: Client, key: string, data?: any): void
  public async onLeave?(client: Client, intentional: boolean): Promise<void>
  public beforePatch?(lastState: State): void
  public afterPatch?(lastState: State): void
  public beforeDispose?(): Promise<void>
  public onDispose?(): Promise<void>

  public setState = (newState: State) => {
    this.state = newState
  }

  public broadcast = (key: string, data?: any) => {
    this.clients.forEach(client => client.send(key, data))
  }

  public setMetadata = (newMetadata: any) => {
    this.roomFetcher
      .setRoomMetadata(this.roomId, newMetadata)
      .then(() => (this.metadata = newMetadata))
      .catch()
  }

  public dispose = async () => {
    if (this.disposing) {
      return
    }
    this.disposing = true
    try {
      await Promise.all(
        this.clients.map(client => this.removeClient(client.sessionId, true))
      )
      if (this.beforeDispose) {
        await this.beforeDispose()
      }
      this.clock.stop()
      await this.roomFetcher.removeRoom(this.roomId)
      if (this._gameMessagePubsub && this._gameMessagePubsub.unsubscribe) {
        this._gameMessagePubsub.unsubscribe()
      }
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
      if (this.disposing) {
        resolve(false)
        return
      }

      const timeOut = this.clock.setTimeout(() => {
        const reconnected = this.clients.filter(c => c.id === client.id).length
          ? true
          : false
        if (listener) {
          listener.clear()
        }

        resolve(reconnected)
      }, seconds * 1000)

      const listener = this.listeners.onJoin.add((joinedClient: Client) => {
        const reconnected = this.clients.filter(c => c.id === joinedClient.id)
          .length
          ? true
          : false

        if (reconnected) {
          if (timeOut) {
            timeOut.clear()
          }
          resolve(true)

          listener.clear()
        }
      })
    })
  }

  private onRoomCreated = () => {
    //
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
        prejoinedClient.origin,
        prejoinedClient.ip,
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
    if (this.owner && this.owner.id && client.id === this.owner.id) {
      this.owner.sessionId = client.sessionId
    }
    client.send(ServerActions.joinedRoom)
    if (this.onJoin) {
      this.listeners.onJoin.call(client, options)
      this.onJoin(client, options)
    }
  }

  private clientRequestsToJoin = async (client: SimpleClient, options: any) => {
    try {
      // Two clients with the same ID are not allowed to join
      if (process.env.BLUEBOAT_NO_SAME_CLIENTS) {
        if (this.clients.filter(c => c.id === client.id).length) {
          // tslint:disable-next-line:no-string-throw
          throw 'ALREADY_IN_ROOM'
        }
      }
      if (this.canClientJoin) {
        await this.canClientJoin(client, options)
      }
      return true
    } catch (e) {
      throw e
    }
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
    this.listeners.onLeave.call(client, intentional)
    if (this.onLeave) {
      await this.onLeave(client, intentional)
    }
    if (!this.clients || !this.clients.length) {
      this.dispose()
        .then()
        .catch()
    }
  }

  private pubSubListener = () => {
    this._gameMessagePubsub = this.pubsub.on(this.roomId, (d: any) => {
      const payload = d as {
        action: string
        client: SimpleClient
        data?: any
      }
      if (!payload || !payload.action) {
        return
      }
      if (payload.action === REQUEST_INFO) {
        this.pubsub.publish(REQUEST_INFO, {
          clients: this.clients,
          state: this.state
        })
        return
      }
      if (!payload.client) {
        return
      }
      const { action, data, client } = payload
      if (action === ClientActions.joinRoom) {
        this.clientRequestsToJoin(client, data.options)
          .then(() => {
            this.addClient(client, data.options)
          })
          .catch(e =>
            this.io.to(client.sessionId).emit(`${this.roomId}-error`, serializeError(e))
          )
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
    Emitter.addListener(PLAYER_LEFT, this._playerPubsub)
  }
}

export default Room
