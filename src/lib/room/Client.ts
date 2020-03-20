import { Server } from 'socket.io'
import SendMessageToClient from '../utils/SendMessageToClient'

class Client {
  public id: string
  public sessionId: string
  public origin: string
  public ip: string
  public send: (key: string, data?: any) => void
  public removeFromRoom: () => void

  constructor(
    roomId: string,
    id: string,
    sessionId: string,
    origin: string,
    ip: string,
    io: Server,
    remove: (clientSessionId: string, intentional: boolean) => void
  ) {
    this.id = id
    this.sessionId = sessionId
    this.origin = origin
    this.ip = ip
    this.send = (key: string, data?: any) => {
      SendMessageToClient(io, roomId, sessionId, key, data)
    }
    this.removeFromRoom = () => remove(this.sessionId, true)
  }
}

export default Client
