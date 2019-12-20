import nanoid from 'nanoid'
import { Server, Socket } from 'socket.io'
import AvaiableRoomType from '../../../types/AvailableRoomType'
import { RoomSnapshot } from '../../../types/RoomSnapshot'
import SimpleClient from '../../../types/SimpleClient'
import PubSub from '../../pubsub/PubSub'
import Room from '../../room/Room'
import Storage from '../../storage/Storage'
import CustomGameValues from '../CustomGameValues'
import RoomFetcher from '../RoomFetcher'

const CreateNewRoom = async (
  client: SimpleClient,
  io: Server,
  roomFetcher: RoomFetcher,
  gameValues: CustomGameValues,
  pubsub: PubSub,
  socket: Socket,
  storage: Storage,
  availableRooms: AvaiableRoomType[],
  onRoomDisposed: (roomId: string) => void,
  roomName: string,
  existingRoomIds: string[],
  creatorOptions: any,
  customRoomIdGenerator?: (
    roomName: string,
    roomOptions?: any,
    creatorOptions?: any
  ) => string
) => {
  try {
    const roomToCreate = availableRooms.filter(r => r.name === roomName)[0]
    if (!roomToCreate) {
      throw new Error(`${roomName} does not have a room handler`)
    }
    let roomId: string
    for (let i = 0; i < 3; i++) {
      if (roomId) {
        break
      }
      const possibleRoomId = customRoomIdGenerator
        ? customRoomIdGenerator(
            roomToCreate.name,
            roomToCreate.options,
            creatorOptions
          )
        : nanoid()
      if (!existingRoomIds.includes(possibleRoomId)) {
        roomId = possibleRoomId
      }
    }
    if (!roomId) {
      throw new Error('Failed to create room with unique ID')
    }
    const initialGameValues = await gameValues.getGameValues()
    const room = new roomToCreate.handler({
      io,
      pubsub,
      owner: client,
      roomId,
      storage,
      creatorOptions,
      options: roomToCreate.options,
      ownerSocket: socket,
      roomFetcher,
      gameValues,
      initialGameValues,
      onRoomDisposed,
      roomType: roomToCreate.name
    })
    const snapshot: RoomSnapshot = {
      id: roomId,
      type: roomName,
      owner: client,
      metadata: {},
      createdAt: Date.now()
    }
    await roomFetcher.addRoom(snapshot)
    return room as Room
  } catch (e) {
    throw e
  }
}

export default CreateNewRoom
