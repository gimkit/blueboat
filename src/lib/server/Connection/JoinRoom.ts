import { NodeRedisPubSub } from 'node-redis-pubsub'
import SimpleClient from '../../../types/SimpleClient'
import ClientActions from '../../constants/ClientActions'
import InternalActions from '../../constants/InternalActions'
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
      InternalActions.newRoomMessage,
      JSON.stringify({
        room: roomId,
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
