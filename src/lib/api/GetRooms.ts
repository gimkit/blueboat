import { serializeError } from 'serialize-error'
import Server from '../server/Server'

const GetRooms = async (req: any, res: any) => {
  try {
    const gameServer = req.gameServer as Server
    // @ts-ignore
    const rooms = await gameServer.roomFetcher.getListOfRoomsWithData()
    res.send(rooms)
  } catch (e) {
    res.status(500).send(serializeError(e))
  }
}

export default GetRooms
