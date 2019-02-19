import nanoid from 'nanoid'
import nrp from 'node-redis-pubsub'
import { Server, Socket } from 'socket.io'
import AvaiableRoomType from '../../../types/AvailableRoomType'
import { RoomSnapshot } from '../../../types/RoomSnapshot'
import SimpleClient from '../../../types/SimpleClient'
import Room from '../../room/Room';
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
  onRoomDisposed: (roomId: string) => void,
  roomName: string,
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
      options: roomToCreate.options,
      ownerSocket: socket,
      roomFetcher,
      onRoomDisposed,
    })
    const snapshot: RoomSnapshot = {
      id: roomId,
      type: roomName,
      owner: client,
      metadata: {}
    }
    await roomFetcher.addRoom(snapshot)
    return room as Room
  } catch (e) {
    throw e
  }
}

export default CreateNewRoom
