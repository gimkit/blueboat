import cors from 'cors'
import Express from 'express'
import { EventEmitterClusterPubsub, RedisStorage, Server } from '../index'
import ChatRoom from './ChatRoom'

const redisOptions = {
  host: 'localhost',
  port: 6379
}

const start = async () => {
  try {
    const app = Express()
    app.use(cors())
    app.options('*', cors())
    const server = new Server({
      app,
      storage: RedisStorage({
        clientOptions: redisOptions
      }),
      pubsub: EventEmitterClusterPubsub.PubSub(),
      redis: redisOptions,
      adapters: [EventEmitterClusterPubsub.ClusterAdapter()],
      admins: { blueboat: 'pass' }
    })
    server.registerRoom('Chat', ChatRoom)
    server.listen(4000, () => console.log('Server listening on port 4000'))
  } catch (e) {
    console.log(e)
  }
}

EventEmitterClusterPubsub.ProcessStarter(start, 2)
