import Redis from 'ioredis'

const threeHours = 60 * 60 * 3

interface RedisClientOptions {
  clientOptions?: Redis.RedisOptions
  customPrefix?: string
}

class RedisClient {
  public client: Redis.Redis
  public prefix: string

  constructor(options: RedisClientOptions) {
    this.prefix = options.customPrefix || 'blueboat:'
    this.client = new Redis(options.clientOptions)
    this.client.on('error', (e: any) => {
      throw new Error(e)
    })
  }

  public fetchKeys = async (prefix: string) => {
    try {
      const keys = await this.client.keys(prefix)
      return keys
    } catch (e) {
      throw e
    }
  }

  public set = async (key: string, value: string, noExpiration?: boolean) => {
    try {
      if (noExpiration) {
        await this.client.set(key, value)
      } else {
        await this.client.set(key, value, 'EX', threeHours)
      }
    } catch (e) {
      throw new Error(
        this.getKey(key) + ' - failed to set value - ' + e && e.message
          ? e.message
          : 'No error message'
      )
    }
  }

  public get = async (key: string, resolveIfNoData?: boolean) => {
    try {
      const value = await this.client.get(this.getKey(key))
      if (!value) {
        if (resolveIfNoData) {
          return null
        } else {
          throw new Error(this.getKey(key) + ' - No data received')
        }
      }
      return value
    } catch (e) {
      throw e
    }
  }

  public remove = async (key: string) => {
    try {
      await this.client.del(this.getKey(key))
    } catch (e) {
      throw e
    }
  }

  public getKey = (key: string) => this.prefix + key
}

export default RedisClient
