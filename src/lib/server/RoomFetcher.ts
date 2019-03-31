import { RoomSnapshot } from '../../types/RoomSnapshot'
import { ROOM_PREFIX } from '../constants/RedisKeys'
import Storage from '../storage/Storage'

interface RoomFetcherOptions {
  storage: Storage
}

/**
 * Can help find a list of currently available Rooms and their snapshots
 */
class RoomFetcher {
  public storage: Storage = null

  constructor(options: RoomFetcherOptions) {
    this.storage = options.storage
  }

  public getListOfRooms = async () => {
    try {
      const rooms = await this.storage.fetchKeys(ROOM_PREFIX)
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
            const room = await this.storage.get(ROOM_PREFIX + r, true)
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
      const room = await this.storage.get(ROOM_PREFIX + roomId)
      return JSON.parse(room)
    } catch (e) {
      throw e
    }
  }

  public setRoomMetadata = async (roomId: string, newMetadata: any) => {
    try {
      const room = await this.findRoomById(roomId)
      await this.storage.set(
        ROOM_PREFIX + room.id,
        JSON.stringify({ ...room, metadata: newMetadata })
      )
    } catch (e) {
      return e
    }
  }

  public addRoom = async (room: RoomSnapshot) => {
    try {
      await this.storage.set(ROOM_PREFIX + room.id, JSON.stringify(room))
    } catch (e) {
      throw e
    }
  }

  public removeRoom = async (roomId: string) => {
    try {
      await this.storage.remove(ROOM_PREFIX + roomId)
    } catch (e) {
      throw e
    }
  }
}

export default RoomFetcher
