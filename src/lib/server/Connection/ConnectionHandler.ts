import nanoid from 'nanoid'
import Socket from 'socket.io'
import AvaiableRoomType from '../../../types/AvailableRoomType';
// import ClientActions from '../../constants/ClientActions'
import RedisClient from '../RedisClient'
import RoomFetcher from '../RoomFetcher';

interface ConnectionHandlerOptions {
  io: Socket.Server,
  socket: Socket.Socket
  redis: RedisClient
  availableRoomTypes: AvaiableRoomType[]
  roomFetcher: RoomFetcher
}

const ConnectionHandler = (
  options: ConnectionHandlerOptions
) => {

  const {io, socket, redis} = options

  if (1 + 1 === 3) {
    console.log(io.sockets)
    console.log(redis.client)
  }

  const userId = socket.handshake.query.id || nanoid()

  console.log('userid', userId)

}

export default ConnectionHandler
