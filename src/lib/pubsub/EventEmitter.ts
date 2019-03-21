import events from 'events'
import nanoid from 'nanoid'
import PubSub from './PubSub'

interface Listener {
  id: string
  key: string
  callback: any
}

const EventEmitter = () => {
  const emitter = new events.EventEmitter()
  const listeners: Listener[] = []
  emitter.setMaxListeners(10000)

  const on = (key: string, callback: (data: string) => any) => {
    const alreadyListeningForKey =
      listeners.filter(l => l.key === key).length > 0
    const id = nanoid()
    listeners.push({ id, key, callback })
    if (!alreadyListeningForKey) {
      emitter.addListener(key, callback)
    }
    return { unsubscribe: () => unsubscribe(id) }
  }

  const publish = (key: string, data: string) => {
    emitter.emit(key, data)
  }

  const unsubscribe = (id: string) => {
    const listener = listeners.filter(l => l.id === id)[0]
    if (!listener) {
      return
    }
    emitter.removeListener(listener.key, listener.callback)
  }

  return new PubSub(on, publish)
}

export default EventEmitter
