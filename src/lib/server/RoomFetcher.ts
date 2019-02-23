import { RoomSnapshot } from '../../types/RoomSnapshot'
import { LIST_OF_ROOM_IDS, ROOM_PREFIX } from '../constants/RedisKeys'
import RedisClient from './RedisClient'

interface RoomFetcherOptions {
  redis: RedisClient
}

interface RoomItem {
  id: string
  createdAt: number
}

const MAX_SECONDS_LENGTH_OF_ROOM = Number(
  process.env.BLUEBOAT_MAX_ROOM_LENGTH || 10800
)

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
      const fetchedRooms = await this.redis.get(LIST_OF_ROOM_IDS, true)
      const rooms: RoomItem[] =
        fetchedRooms &&
        JSON.parse(fetchedRooms) &&
        JSON.parse(fetchedRooms).forEach
          ? JSON.parse(fetchedRooms)
          : []
      rooms.forEach(async room => {
        if (
          room.createdAt / 1000 + MAX_SECONDS_LENGTH_OF_ROOM <
          Date.now() / 1000
        ) {
          await this.removeRoom(room.id)
        }
      })
      return rooms
    } catch (e) {
      throw e
    }
  }

  public getListOfRoomsWithData = async () => {
    try {
      const roomList = await this.getListOfRooms()
      const rooms = await Promise.all(
        roomList.map(async (r: RoomItem) => {
          try {
            const room = await this.redis.get(ROOM_PREFIX + r.id)
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
      const rooms = await this.getListOfRooms()
      const newRooms = [...rooms, { id: room.id, createdAt: Date.now() }]
      await this.redis.set(ROOM_PREFIX + room.id, JSON.stringify(room))
      await this.redis.set(LIST_OF_ROOM_IDS, JSON.stringify(newRooms))
    } catch (e) {
      throw e
    }
  }

  public removeRoom = async (roomId: string) => {
    try {
      const rooms = await this.getListOfRooms()
      const newRooms = rooms.filter(room => room.id !== roomId)
      await this.redis.set(LIST_OF_ROOM_IDS, JSON.stringify(newRooms))
      await this.redis.set(ROOM_PREFIX + roomId, '')
    } catch (e) {
      throw e
    }
  }
}

export default RoomFetcher
