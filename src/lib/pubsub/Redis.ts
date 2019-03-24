import Redis, { RedisOptions } from 'ioredis'
import nanoid from 'nanoid'
import msgpack from 'notepack.io'
import PubSub from './PubSub'

interface Callback {
  id: any
  callback: any
}

const RedisPubsub = (options: RedisOptions) => {
  const redis = new Redis(options)
  const pub = new Redis(options)

  const listeners = new Map<string, Callback[]>()

  redis.on('messageBuffer', (k: Buffer, d: Buffer) => {
    const key = k.toString('utf8')
    const data = msgpack.decode(d).data
    const callbacks = listeners.get(key)
    if (callbacks && callbacks.length) {
      callbacks.forEach(callback => {
        callback.callback(data)
      })
    }
  })

  const on = (key: string, callback: (data: string) => any) => {
    const alreadyListeningForKey = listeners.has(key)
    const id = nanoid()
    if (!alreadyListeningForKey) {
      listeners.set(key, [{ id, callback }])
      redis
        .subscribe(key)
        .then()
        .catch()
    } else {
      const currentListeners = listeners.get(key)
      // @ts-ignore
      const newListeners: Callback[] = currentListeners.push({ id, callback })
      listeners.set(key, newListeners)
    }
    return { unsubscribe: () => unsubscribe(key, id) }
  }

  const publish = (key: string, data: any) => {
    pub
      .publish(key, msgpack.encode({ data }))
      .then()
      .catch()
    return
  }

  const unsubscribe = (key: string, id: string) => {
    const listenersForKey = listeners.get(key)
    if (!listenersForKey || !listenersForKey.length) {
      return
    }
    if (listenersForKey.length === 1) {
      redis
        .unsubscribe(key)
        .then()
        .catch()
      listeners.delete(key)
    } else {
      const newListeners = listenersForKey.filter(l => l.id !== id)
      listeners.set(key, newListeners)
    }
  }

  return new PubSub(on, publish)
}

export default RedisPubsub
