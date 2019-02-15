import nanoid from 'nanoid'
import nrp from 'node-redis-pubsub'
import { Server, Socket } from 'socket.io'
import AvaiableRoomType from '../../../types/AvailableRoomType'
import { RoomSnapshot } from '../../../types/RoomSnapshot'
import SimpleClient from '../../../types/SimpleClient'
import { LIST_OF_ROOM_IDS, ROOM_PREFIX } from '../../constants/RedisKeys'
import RedisClient from '../RedisClient'
import RoomFetcher from '../RoomFetcher';

const CreateNewRoom = async (
  client: SimpleClient,
  io: Server,
  roomFetcher: RoomFetcher,
  pubsub: nrp.NodeRedisPubSub,
  socket: Socket,
  redis: RedisClient,
  availableRooms: AvaiableRoomType[],
  roomName: string,
  roomOptions = {}
) => {
  try {
    const roomToCreate = availableRooms.filter(r => r.name === roomName)[0]
    if (!roomToCreate) {
      throw new Error(`${roomName} does not have a room handler`)
    }
    const roomId = nanoid()
    const room = new roomToCreate.handler({
      io,
      pubsub,
      owner: client,
      roomId,
      redis,
      options: { ...(roomToCreate.options || {}), ...roomOptions },
      ownerSocket: socket
    })
    const listOfRooms = await roomFetcher.getListOfRooms()
    await redis.set(LIST_OF_ROOM_IDS, JSON.stringify([...listOfRooms, roomId]))
    const snapshot: RoomSnapshot = {
      id: roomId,
      type: roomName,
      owner: client,
      metadata: {}
    }
    await redis.set(ROOM_PREFIX + roomId, JSON.stringify(snapshot))
    return room
  } catch (e) {
    throw e
  }
}

export default CreateNewRoom
