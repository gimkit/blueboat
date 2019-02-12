import { Server } from 'socket.io'
import SendMessageToClient from '../utils/SendMessageToClient'

class Client {
  public id: string
  public sessionId: string
  public send: (key: string, message: any) => void
  public disconnect: () => void

  constructor(id: string, sessionId: string, io: Server) {
    this.id = id
    this.sessionId = sessionId
    this.send = (key: string, data: any) =>
      SendMessageToClient(io, sessionId, key, data)
    this.disconnect = () =>
      SendMessageToClient(io, sessionId, EnginePrivateActions.forceDisconnect)
  }
}

export default Client
