import nanoid from 'nanoid'
import nrp from 'node-redis-pubsub'
import serializeError from 'serialize-error'
import Socket from 'socket.io'
import AvaiableRoomType from '../../../types/AvailableRoomType'
import SimpleClient from '../../../types/SimpleClient'
import ClientActions from '../../constants/ClientActions'
import ServerActions from '../../constants/ServerActions'
import ServerPrivateActions from '../../constants/ServerPrivateActions'
import RedisClient from '../RedisClient'
import RoomFetcher from '../RoomFetcher'
import CreateNewRoom from './CreateNewRoom'
import JoinRoom from './JoinRoom'

interface ConnectionHandlerOptions {
  io: Socket.Server
  socket: Socket.Socket
  pubsub: nrp.NodeRedisPubSub
  redis: RedisClient
  availableRoomTypes: AvaiableRoomType[]
  roomFetcher: RoomFetcher
}

const ConnectionHandler = (options: ConnectionHandlerOptions) => {
  const { io, socket, redis, pubsub, availableRoomTypes, roomFetcher } = options

  const userId = socket.handshake.query.id || nanoid()
  const client: SimpleClient = { id: userId, sessionId: socket.id }
  socket.emit(ServerActions.clientIdSet, userId)

  socket.on(
    ServerPrivateActions.send,
    (message: { roomId: string; key: string; data?: any }) => {
      if (!message || !message.key || !message.roomId) {
        return
      }
      if (message.key === ServerPrivateActions.forceDisconnect) {
        socket.disconnect(true)
      }
    }
  )

  socket.on(
    ClientActions.createNewRoom,
    async (request: {
      type: string
      options: any
      uniqueRequestId: string
    }) => {
      try {
        if (!request || !request.type || !request.uniqueRequestId) {
          throw new Error('Room type needed')
        }
        const room = await CreateNewRoom(
          client,
          io,
          roomFetcher,
          pubsub,
          socket,
          redis,
          availableRoomTypes,
          request.type,
          request.options
        )
        socket.emit(`${request.uniqueRequestId}-create`, room.roomId)
      } catch (e) {
        socket.emit(`${request.uniqueRequestId}-error`, serializeError(e))
      }
    }
  )

  socket.on(
    ClientActions.joinRoom,
    async (payload: { roomId: string; options?: any }) => {
      try {
        const { roomId } = payload
        if (!roomId) {
          throw new Error('Room ID not provided')
        }
        await JoinRoom(roomId, client, roomFetcher, pubsub, payload.options)
      } catch (e) {
        if (payload && payload.roomId) {
          socket.emit(`${payload.roomId}-error`, serializeError(e))
        }
      }
    }
  )
}

export default ConnectionHandler
