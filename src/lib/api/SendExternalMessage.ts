import { EXTERNAL_MESSAGE } from '../constants/PubSubListeners'

const SendExternalMessage = (req: any, res: any) => {

  const body: { key: string, data?: any } = req.body

  if (!body) { res.status(500).send("Body required for external messages"); return }
  if (!body.key) { res.status(500).send("Key property required for external messages"); return }
  if (typeof body.key !== "string") { res.status(500).send("Key property must be a string"); return }

  req.gameServer.pubsub.publish(req.params.room, {
    action: EXTERNAL_MESSAGE, data: {
      key: body.key,
      data: body.data
    }
  })
  res.send('OK')
}

export default SendExternalMessage
