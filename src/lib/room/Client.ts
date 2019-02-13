import { Server } from 'socket.io'
import ServerPrivateActions from '../constants/ServerPrivateActions';
import SendMessageToClient from '../utils/SendMessageToClient'

class Client {
  public id: string
  public sessionId: string
  public send: (key: string, data?: any) => void
  public disconnect: () => void

  constructor(roomId: string, id: string, sessionId: string, io: Server) {
    this.id = id
    this.sessionId = sessionId
    this.send = (key: string, data?: any) => {
      SendMessageToClient(io, roomId, sessionId, key, data)
    }

    this.disconnect = () =>
      SendMessageToClient(
        io,
        roomId,
        sessionId,
        ServerPrivateActions.forceDisconnect
      )
  }
}

export default Client
