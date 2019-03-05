import { RoomSnapshot } from '../../types/RoomSnapshot'
import { ROOM_PREFIX } from '../constants/RedisKeys'
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
      const fetchedRooms = await this.redis.fetchKeys(
        this.redis.getKey(ROOM_PREFIX) + '*'
      )
      const rooms = fetchedRooms.map(room =>
        room.replace(this.redis.getKey(ROOM_PREFIX), '')
      )
      return rooms
    } catch (e) {
      throw e
    }
  }

  public getListOfRoomsWithData = async () => {
    try {
      const roomList = await this.getListOfRooms()
      const rooms = await Promise.all(
        roomList.map(async r => {
          try {
            const room = await this.redis.get(ROOM_PREFIX + r, true)
            if (room) {
              return JSON.parse(room) as RoomSnapshot
            }
            return null
          } catch (e) {
            throw e
          }
        })
      )
      return rooms.filter(room => room !== null)
    } catch (e) {
      throw e
    }
  }

  public findRoomById = async (roomId: string) => {
    try {
      const room = await this.redis.get(ROOM_PREFIX + roomId)
      return JSON.parse(room)
    } catch (e) {
      throw e
    }
  }

  public setRoomMetadata = async (roomId: string, newMetadata: any) => {
    try {
      const room = await this.findRoomById(roomId)
      await this.redis.set(
        ROOM_PREFIX + room.id,
        JSON.stringify({ ...room, metadata: newMetadata })
      )
    } catch (e) {
      return e
    }
  }

  public addRoom = async (room: RoomSnapshot) => {
    try {
      await this.redis.set(ROOM_PREFIX + room.id, JSON.stringify(room))
    } catch (e) {
      throw e
    }
  }

  public removeRoom = async (roomId: string) => {
    try {
      await this.redis.remove(ROOM_PREFIX + roomId)
    } catch (e) {
      throw e
    }
  }
}

export default RoomFetcher
