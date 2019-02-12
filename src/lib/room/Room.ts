import { Server, Socket } from "socket.io";
import SimpleClient from "../../types/SimpleClient";
import RedisClient from "../server/RedisClient";
import Client from "./Client";

interface RoomOptions {
  io: Server
  roomId: string
  redis: RedisClient
  owner: SimpleClient
  ownerSocket: Socket
  options: {}
}

class Room {

  public roomId: string
  public clients: Client[] = []

  // API functions
  public canClientJoin?: (client: SimpleClient, options?: any) => boolean

  // Private Room Helpers and Objects
  private io: Server
  private redis: RedisClient
  private ownerSocket: Socket
  private owner: SimpleClient

  constructor(options: RoomOptions) {
    this.roomId = options.roomId
    this.io = options.io
    this.redis = options.redis
    this.owner = options.owner
    this.ownerSocket = options.ownerSocket
    this.clientCanJoin(options.owner)
  }

  private clientCanJoin(prejoinedClient: SimpleClient) {
    this.clients.push(new Client(prejoinedClient.id, prejoinedClient.sessionId, this.io))
  }

  private clientRequestsToJoin(client: SimpleClient, options: any) {
    if (this.canClientJoin) {
      return this.canClientJoin(client, options)
    }
    return true
  }

}

export default Room