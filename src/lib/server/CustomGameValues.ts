import { GAME_VALUES } from '../constants/RedisKeys'
import RedisClient from './RedisClient'

interface CustomGameValueOptions {
  redis: RedisClient
}

/**
 * Used for global game values in which you can change in the admin panel
 */
class CustomGameValues {
  public redis: RedisClient = null

  constructor(options: CustomGameValueOptions) {
    this.redis = options.redis
  }

  public setGlobalGameValuesObject = async (newGameValues: any) => {
    try {
      await this.redis.set(GAME_VALUES, JSON.stringify(newGameValues), true)
    } catch (e) {
      throw e
    }
  }

  public getGameValues = async (): Promise<any> => {
    try {
      const gameValues = await this.redis.get(GAME_VALUES, true)
      if (gameValues) {
        return JSON.parse(gameValues)
      }
      return {}
    } catch (e) {
      return {}
    }
  }

  public getGameValue = async<T> (
    key: string,
    defaultValue?: T
  ): Promise<T> => {
    try {
      const gameValues = await this.getGameValues()
      if (gameValues[key]) {
        return gameValues[key]
      }
      return defaultValue
    } catch (e) {
      throw defaultValue
    }
  }

  public setGameValue = async (key: string, value?: any) => {
    try {
      const gameValues = await this.getGameValues()
      const newGameValues = { ...gameValues, [key]: value }
      await this.redis.set(GAME_VALUES, JSON.stringify(newGameValues), true)
    } catch (e) {
      throw e
    }
  }

  public resetGameValues = async () => {
    try {
      await this.redis.set(GAME_VALUES, JSON.stringify({}), true)
    } catch (e) {
      throw e
    }
  }
}

export default CustomGameValues
