import { Server } from 'socket.io'

const SendMessageToClient = (
  emitter: Server,
  roomId: string,
  to: string,
  key: string,
  data?: any
) => emitter.to(to).emit(`MESSAGE-${roomId}`, { key, data })
export default SendMessageToClient
