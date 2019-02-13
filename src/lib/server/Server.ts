import Express from 'express'
import { Server as HTTPServer } from 'http'
import nrp from 'node-redis-pubsub'
import socket from 'socket.io'
import MessagePackParser from 'socket.io-msgpack-parser'
import redisAdapter from 'socket.io-redis'
import AvaiableRoomType from '../../types/AvailableRoomType'
import ConnectionHandler from './Connection/ConnectionHandler'
import RedisClient from './RedisClient'
import RoomFetcher from './RoomFetcher'

interface RedisOptions {
  host: string
  port: number
  auth_pass?: string
  requestsTimeout?: number
}

interface ServerArguments {
  app: Express.Application
  redisOptions: RedisOptions
}

interface ServerState {
  availableRoomTypes: AvaiableRoomType[]
}

class Server {
  public server: HTTPServer = null
  public redis: RedisClient = null

  public state: ServerState = { availableRoomTypes: [] }
  public listen: (port: number, callback: () => void) => void = null
  private app: Express.Application = null
  private io: SocketIO.Server = null
  private pubsub: nrp.NodeRedisPubSub
  private roomFetcher: RoomFetcher = null

  constructor(options: ServerArguments) {
    this.app = options.app
    this.redis = new RedisClient({
      clientOptions: options.redisOptions as any
    })
    this.pubsub = nrp(options.redisOptions)
    this.roomFetcher = new RoomFetcher({ redis: this.redis })
    this.spawnServer(options.redisOptions)
  }

  public registerRoom = (roomName: string, handler: any, options?: any) => {
    const { availableRoomTypes } = this.state
    if (availableRoomTypes.map(room => room.name).includes(roomName)) {
      // Can't have two handlers for the same room
      return
    }
    this.state.availableRoomTypes.push({ name: roomName, handler, options })
    return
  }

  private spawnServer = (redisOptions: RedisOptions) => {
    this.server = new HTTPServer(this.app)
    this.listen = (port: number, callback: () => void) =>
      this.server.listen(port, callback)
    this.io = socket({
      parser: MessagePackParser,
      path: '/blueboat'
    })
    this.io.adapter(redisAdapter(redisOptions))
    this.io.attach(this.server, { cookie: true })
    this.io.on('connection', s =>
      ConnectionHandler({
        availableRoomTypes: this.state.availableRoomTypes,
        io: this.io,
        pubsub: this.pubsub,
        redis: this.redis,
        roomFetcher: this.roomFetcher,
        socket: s
      })
    )
  }
}

export default Server
