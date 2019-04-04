import NodeCache from 'node-cache'
import * as EventEmitterCluster from '../pubsub/EventEmitterCluster'
import Storage from './Storage'

const threeHours = 60 * 60 * 3

const MEMORY_COMMAND = 'INTERNAL_MEMORY_CLUSTER'
const SET = 'SET'
const REMOVE = 'REMOVE'

const Memory = () => {
  const cache = new NodeCache()
  const pubsub = EventEmitterCluster.PubSub()

  pubsub.on(MEMORY_COMMAND, (data: any) => {
    if (data && data.type) {
      if (data.type === SET) {
        set(data.data.key, data.data.value, data.data.setOptions).catch()
      }
      if (data.type === REMOVE) {
        remove(data.data.key).catch()
      }
    }
  })

  const fetchKeys = (prefix: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      cache.keys((err, keys) => {
        if (err) {
          return reject(err)
        }
        return resolve(
          keys
            .filter(key => key.startsWith(prefix))
            .map(key => key.replace(prefix, ''))
        )
      })
    })
  }

  const set = (
    key: string,
    value: string,
    setOptions?: { noExpiration: boolean }
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (setOptions && setOptions.noExpiration) {
        cache.set(key, value, err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      } else {
        cache.set(key, value, threeHours, err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }
    })
  }

  const get = (key: string, resolveIfNoData?: boolean): Promise<string> => {
    return new Promise((resolve, reject) => {
      cache.get(key, (err, data) => {
        if (err) {
          reject(err)
        } else {
          if (!data && !resolveIfNoData) {
            reject(`No data found for ${key}`)
          } else {
            // @ts-ignore
            resolve(data)
          }
        }
      })
    })
  }

  const remove = (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      cache.del(key, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  const setContainer = async (
    key: string,
    value: string,
    setOptions?: { noExpiration: boolean }
  ) => {
    pubsub.publish(MEMORY_COMMAND, {
      type: SET,
      data: {
        key,
        value,
        setOptions
      }
    })
  }

  const removeContainer = async (key: string) => {
    pubsub.publish(MEMORY_COMMAND, {
      type: REMOVE,
      data: {
        key
      }
    })
  }

  return new Storage(get, setContainer, removeContainer, fetchKeys)
}

export default Memory
