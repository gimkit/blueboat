import Clock from '@gamestdio/timer'
import { NodeRedisPubSub } from 'node-redis-pubsub'
import { Server, Socket } from 'socket.io'
import SimpleClient from '../../types/SimpleClient'
import ClientActions from '../constants/ClientActions'
import ServerActions from '../constants/ServerActions'
import RedisClient from '../server/RedisClient'
import Client from './Client'

interface RoomOptions {
  io: Server
  roomId: string
  redis: RedisClient
  pubsub: NodeRedisPubSub
  owner: SimpleClient
  ownerSocket: Socket
  options: {}
}

class Room {
  public roomId: string
  public clients: Client[] = []
  public clock = new Clock()

  // API functions
  public canClientJoin?: (client: SimpleClient, options?: any) => boolean
  public onJoin?: (client: Client, options?: any) => void

  // Private Room Helpers and Objects
  private io: Server
  private pubsub: NodeRedisPubSub
  private redis: RedisClient
  private ownerSocket: Socket
  private owner: SimpleClient

  constructor(options: RoomOptions) {
    this.roomId = options.roomId
    this.io = options.io
    this.pubsub = options.pubsub
    this.redis = options.redis
    this.owner = options.owner
    this.ownerSocket = options.ownerSocket
    this.pubSubListener()
  }

  private findFullClientFromSimpleClient(simpleClient: SimpleClient) {
    return this.clients.filter(
      client =>
        client.sessionId === simpleClient.sessionId && client.id === client.id
    )[0]
  }

  private addClient(prejoinedClient: SimpleClient, options?: any) {
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

  private clientHasJoined(client: Client, options?: any) {
    client.send(ServerActions.joinedRoom)
    if (this.onJoin) {
      this.onJoin(client, options)
    }
  }

  private clientRequestsToJoin(client: SimpleClient, options: any) {
    if (this.canClientJoin) {
      return this.canClientJoin(client, options)
    }
    return true
  }

  private pubSubListener() {
    this.pubsub.on(this.roomId, (d: string) => {
      const payload = JSON.parse(d) as { action: string; client: SimpleClient; data?: any }
      if (!payload || !payload.action || !payload.client) {
        return
      }
      const {action, data, client} = payload
      if (action === ClientActions.joinRoom) {
        if (this.clientRequestsToJoin(client, data.options)) {
          this.addClient(client, data.options)
          return
        } else {
          this.io.to(client.sessionId).emit(`${this.roomId}-error`, 'Not allowed to join room')
        }
      }
    })
  }
}

export default Room
