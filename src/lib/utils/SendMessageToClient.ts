import { Server } from 'socket.io'

const SendMessageToClient = (io: Server, to: string, key: string, data?: any) =>
  io.to(to).emit(EnginePrivateActions.send, { key, data })
export default SendMessageToClient
