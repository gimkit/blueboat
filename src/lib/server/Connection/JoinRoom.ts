import SimpleClient from '../../../types/SimpleClient'
import ClientActions from '../../constants/ClientActions'
import PubSub from '../../pubsub/PubSub'
import RoomFetcher from '../RoomFetcher'

const JoinRoom = async (
  roomId: string,
  client: SimpleClient,
  roomFetcher: RoomFetcher,
  pubsub: PubSub,
  options?: any
) => {
  try {
    await roomFetcher.findRoomById(roomId)
    pubsub.publish(
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
