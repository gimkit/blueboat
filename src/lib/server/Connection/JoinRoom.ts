import { NodeRedisPubSub } from 'node-redis-pubsub'
import SimpleClient from '../../../types/SimpleClient'
import ClientActions from '../../constants/ClientActions'
import RoomFetcher from '../RoomFetcher'

const JoinRoom = async (
  roomId: string,
  client: SimpleClient,
  roomFetcher: RoomFetcher,
  pubsub: NodeRedisPubSub,
  options?: any
) => {
  try {
    await roomFetcher.findRoomById(roomId)
    pubsub.emit(
      roomId,
      JSON.stringify({
        action: ClientActions.joinRoom,
        client,
        data: { options }
      })
    )
    return
  } catch (e) {
    throw e
  }
}

export default JoinRoom
