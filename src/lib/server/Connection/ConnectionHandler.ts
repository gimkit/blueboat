import nanoid from 'nanoid'
import serializeError from 'serialize-error'
import Socket from 'socket.io'
import AvaiableRoomType from '../../../types/AvailableRoomType'
import SimpleClient from '../../../types/SimpleClient'
import ClientActions from '../../constants/ClientActions'
import { PLAYER_LEFT } from '../../constants/PubSubListeners'
import ServerActions from '../../constants/ServerActions'
import PubSub from '../../pubsub/PubSub'
import Room from '../../room/Room'
import CustomGameValues from '../CustomGameValues'
import RedisClient from '../RedisClient'
import RoomFetcher from '../RoomFetcher'
import CreateNewRoom from './CreateNewRoom'
import JoinRoom from './JoinRoom'

interface ConnectionHandlerOptions {
  io: Socket.Server
  socket: Socket.Socket
  pubsub: PubSub
  redis: RedisClient
  availableRoomTypes: AvaiableRoomType[]
  roomFetcher: RoomFetcher
  gameValues: CustomGameValues
  onRoomMade: (room: Room) => void
  onRoomDisposed: (roomId: string) => void
  customRoomIdGenerator?: (roomName: string, options?: any) => string
}

const ConnectionHandler = (options: ConnectionHandlerOptions) => {
  const {
    io,
    socket,
    redis,
    pubsub,
    availableRoomTypes,
    roomFetcher,
    gameValues,
    onRoomMade,
    onRoomDisposed,
    customRoomIdGenerator
  } = options

  const userId = socket.handshake.query.id || nanoid()
  const client: SimpleClient = { id: userId, sessionId: socket.id }
  socket.emit(ServerActions.clientIdSet, userId)

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
          gameValues,
          pubsub,
          socket,
          redis,
          availableRoomTypes,
          onRoomDisposed,
          request.type,
          await roomFetcher.getListOfRooms(),
          request.options,
          customRoomIdGenerator
        )
        onRoomMade(room)
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

  socket.on(
    ClientActions.sendMessage,
    (message: { room: string; key: string; data?: any }) => {
      if (message.key === undefined || !message.room) {
        return
      }
      pubsub.publish(
        message.room,
        JSON.stringify({
          client,
          action: ClientActions.sendMessage,
          data: { key: message.key, data: message.data }
        })
      )
    }
  )

  socket.on('disconnect', () => {
    pubsub.publish(PLAYER_LEFT, socket.id)
  })
}

export default ConnectionHandler
