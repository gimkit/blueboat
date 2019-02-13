import { Server } from 'socket.io'

const SendMessageToClient = (
  io: Server,
  roomId: string,
  to: string,
  key: string,
  data?: any
) => io.to(to).emit(`message-${roomId}`, { key, data })
export default SendMessageToClient
