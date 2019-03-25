import cors from 'cors'
import Express from 'express'
import { EventEmitterPubSub, Server } from '../index'
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
      redisOptions,
      pubsub: EventEmitterPubSub(),
      admins: { blueboat: 'pass' }
    })
    server.registerRoom('Chat', ChatRoom)
    server.listen(4000, () => console.log('Server listening on port 4000'))
  } catch (e) {
    console.log(e)
  }
}

start()
