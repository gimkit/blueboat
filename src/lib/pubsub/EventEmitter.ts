import events from 'events'
import nanoid from 'nanoid'
import PubSub from './PubSub'

interface Callback {
  id: any
  callback: any
}

const EventEmitter = () => {
  const emitter = new events.EventEmitter()
  const listeners = new Map<string, Callback[]>()
  emitter.setMaxListeners(10000)

  const on = (key: string, callback: (data: string) => any) => {
    const alreadyListeningForKey = listeners.has(key)
    const id = nanoid()
    if (!alreadyListeningForKey) {
      emitter.addListener(key, callback)
      listeners.set(key, [{ id, callback }])
    } else {
      const currentListeners = listeners.get(key)
      // @ts-ignore
      const newListeners: Callback[] = currentListeners.push({ id, callback })
      listeners.set(key, newListeners)
    }
    return { unsubscribe: () => unsubscribe(key, id) }
  }

  const publish = (key: string, data: string) => {
    emitter.emit(key, data)
  }

  const unsubscribe = (key: string, id: string) => {
    const listenersForKey = listeners.get(key)
    if (listenersForKey.length === 1) {
      emitter.removeListener(key, listenersForKey[0].callback)
      listeners.delete(key)
    } else {
      const newListeners = listenersForKey.filter(l => l.id !== id)
      listeners.set(key, newListeners)
    }
  }

  return new PubSub(on, publish)
}

export default EventEmitter
