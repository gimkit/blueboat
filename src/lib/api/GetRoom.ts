import { REQUEST_INFO } from '../constants/PubSubListeners'
import Server from '../server/Server'

const GetRoom = (req: any, res: any) => {
  let hasSent = false
  const gameServer = req.gameServer as Server
  // @ts-ignore
  const listener = gameServer.pubsub.on(REQUEST_INFO, info => {
    res.send(info)
    hasSent = true
    listener.unsubscribe()
  })
  // @ts-ignore
  gameServer.pubsub.publish(req.params.room, { action: REQUEST_INFO })
  setTimeout(() => {
    if (!hasSent) {
      listener.unsubscribe()
      res.status(404).send('No room found')
    }
  }, 5000)
}

export default GetRoom
