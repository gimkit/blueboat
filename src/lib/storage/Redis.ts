import Redis from 'ioredis'
import Storage from './Storage'
const threeHours = 60 * 60 * 3

interface RedisClientOptions {
  clientOptions?: Redis.RedisOptions
  customPrefix?: string
}

const RedisStorage = (options: RedisClientOptions) => {
  const client = new Redis(options.clientOptions)
  const basePrefix = options.customPrefix || 'blueboat:'
  client.on('error', (e: any) => {
    throw new Error(e)
  })

  const getKey = (key: string) => basePrefix + key

  const fetchKeys = async (prefix: string) => {
    try {
      const fullPrefix = getKey(prefix)
      const keys = await client.keys(getKey(prefix + '*'))
      return keys.map(key => key.replace(fullPrefix, ''))
    } catch (e) {
      throw e
    }
  }

  const set = async (
    key: string,
    value: string,
    setOptions?: { noExpiration: boolean }
  ) => {
    try {
      const noExpiration = setOptions && setOptions.noExpiration
      if (noExpiration) {
        await client.set(getKey(key), value)
      } else {
        await client.set(getKey(key), value, 'EX', threeHours)
      }
    } catch (e) {
      throw new Error(
        getKey(key) + ' - failed to set value - ' + e && e.message
          ? e.message
          : 'No error message'
      )
    }
  }

  const get = async (key: string, resolveIfNoData?: boolean) => {
    try {
      const value = await client.get(getKey(key))
      if (!value) {
        if (resolveIfNoData) {
          return null
        } else {
          throw new Error(getKey(key) + ' - No data received')
        }
      }
      return value
    } catch (e) {
      throw e
    }
  }

  const remove = async (key: string) => {
    try {
      await client.del(getKey(key))
    } catch (e) {
      throw e
    }
  }

  return new Storage(get, set, remove, fetchKeys)
}

export default RedisStorage
