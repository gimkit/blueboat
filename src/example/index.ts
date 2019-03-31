import cors from 'cors'
import Express from 'express'
import { EventEmitterPubSub, MemoryStorage, Server } from '../index'
import ChatRoom from './ChatRoom'

const start = async () => {
  try {
    const app = Express()
    app.use(cors())
    app.options('*', cors())
    const server = new Server({
      app,
      storage: MemoryStorage(),
      pubsub: EventEmitterPubSub(),
      redis: {
        host: 'localhost',
        port: 6379
      },
      admins: { blueboat: 'pass' }
    })
    server.registerRoom('Chat', ChatRoom)
    server.listen(4000, () => console.log('Server listening on port 4000'))
  } catch (e) {
    console.log(e)
  }
}

start()
