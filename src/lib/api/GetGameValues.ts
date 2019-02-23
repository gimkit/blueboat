import serializeError from 'serialize-error'
import Server from '../server/Server'

const GetGameValues = async(req: any, res: any) => {
  try {
    const gameServer = req.gameServer as Server
    const gameValues = await gameServer.gameValues.getGameValues()
    res.send(gameValues)
  } catch(e) {
    res.status(500).send(serializeError(e))
  }


}

export default GetGameValues
