import cors from 'cors'
import Express from 'express'
import Server from '../lib/server/Server'

const app = Express()
app.use(cors())
app.options('*', cors());
const server = new Server({app, redisOptions: {
  host: 'localhost',
  port: 6379,
}})

server.registerRoom('Test', () => false)

server.listen(4000, () => console.log("Server listening on port 4000"))