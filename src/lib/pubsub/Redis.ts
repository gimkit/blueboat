import Redis, { RedisOptions } from 'ioredis'
import nanoid from 'nanoid'
import PubSub from './PubSub'

interface Listener {
  id: string
  key: string
  callback: any
}

const RedisPubsub = (options: RedisOptions) => {
  const redis = new Redis(options)
  const pub = new Redis(options)

  const listeners: Listener[] = []

  redis.on('message', (key: string, data: any) => {
    listeners.forEach(listener => {
      if (listener.key === key) {
        listener.callback(data)
      }
    })
  })

  const on = (key: string, callback: (data: string) => any) => {
    const alreadyListeningForKey =
      listeners.filter(l => l.key === key).length > 0
    const id = nanoid()
    listeners.push({ id, key, callback })
    if (!alreadyListeningForKey) {
      redis
        .subscribe(key)
        .then()
        .catch()
    }
    return { unsubscribe: () => unsubscribe(id) }
  }

  const publish = (key: string, data: string) => {
    pub
      .publish(key, data)
      .then()
      .catch()
    return
  }

  const unsubscribe = (id: string) => {
    const listener = this.listeners.filter(l => l.id === id)[0]
    if (!listener) {
      return
    }
    const key = listener.key
    this.listeners = this.listeners.filter(l => l.id !== id)
    const stillListenersOnKey =
      this.listeners.filter(l => l.key === key).length > 0
    if (stillListenersOnKey) {
      return
    }
    redis
      .unsubscribe(key)
      .then()
      .catch()
    return
  }

  return new PubSub(on, publish)
}

export default RedisPubsub
