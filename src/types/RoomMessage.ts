import SimpleClient from "./SimpleClient";

interface RoomMessage {
  action: string
  client: SimpleClient
  payload: any
}

export default RoomMessage