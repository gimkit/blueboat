import { RoomSnapshot } from '../../types/RoomSnapshot'
import { LIST_OF_ROOM_IDS, ROOM_PREFIX } from '../constants/RedisKeys'
import RedisClient from './RedisClient'

interface RoomFetcherOptions {
  redis: RedisClient
}

/**
 * Can help find a list of currently available Rooms and their snapshots
 */
class RoomFetcher {
  public redis: RedisClient = null

  constructor(options: RoomFetcherOptions) {
    this.redis = options.redis
  }

  public getListOfRooms = async () => {
    try {
      const rooms = await this.redis.get(LIST_OF_ROOM_IDS, true)
      return rooms ? (JSON.parse(rooms) as string[]) : []
    } catch (e) {
      throw e
    }
  }

  public getListOfRoomsWithData = async () => {
    try {
      const roomList = await this.getListOfRooms()
      const rooms = await Promise.all(
        roomList.map(async (roomId: string) => {
          try {
            const room = await this.redis.get(ROOM_PREFIX + roomId)
            return JSON.parse(room) as RoomSnapshot
          } catch (e) {
            throw e
          }
        })
      )
      return rooms
    } catch (e) {
      throw e
    }
  }

  public findRoomById = async (roomId: string) => {
    try {
      const rooms = await this.getListOfRoomsWithData()
      const room = rooms.filter(r => r.id === roomId)[0]
      if (!room) {
        throw new Error(`No room found with id ${roomId}`)
      }
      return room
    } catch (e) {
      throw e
    }
  }
}

export default RoomFetcher
