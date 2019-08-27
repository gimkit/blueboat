import ampq from 'amqplib'
import msgpack from 'msgpack-lite'
// @ts-ignore
import nanoid = require('nanoid')
import { PubSub } from '../..'

interface Callback {
  id: any
  callback: any
}

const RabbitMQ = (connectString: string) => {
  const listeners = new Map<string, Callback[]>()

  let rabbitPublish: any = null
  let rabbitListen: any = null
  let rabbitUnsubscribe: any = null

  const on = (key: string, callback: any) => {
    const id = nanoid()
    rabbitListen(key)
    const alreadyListening = listeners.has(key)
    if (alreadyListening) {
      const currentListeners = listeners.get(key)
      const newListeners = currentListeners.push({ id, callback })
      // @ts-ignore
      listeners.set(key, newListeners)
    } else {
      listeners.set(key, [{ id, callback }])
    }
    return { unsubscribe: () => unsubscribe(key, id) }
  }

  const publish = (key: string, data: any) => {
    rabbitPublish(key, data)
  }

  const unsubscribe = (key: string, id: string) => {
    const listenersForKey = listeners.get(key)
    if (!listeners || !listenersForKey.length) {
      return
    }
    if (listenersForKey.length === 1) {
      rabbitUnsubscribe(key)
      listeners.delete(key)
    } else {
      const newListeners = listenersForKey.filter(l => l.id !== id)
      listeners.set(key, newListeners)
    }
  }

  return new Promise((resolve, reject) => {
    ampq
      .connect(connectString)
      .then(connection => {
        connection.createChannel().then(channel => {
          rabbitPublish = (key: string, message: any) => {
            channel.assertQueue(key)
            channel.sendToQueue(key, msgpack.encode({ data: message }))
          }
          rabbitListen = (key: string) => {
            const alreadyListening = listeners.has(key)
            if (alreadyListening) {
              return
            }
            channel.assertQueue(key)
            channel.consume(key, d => {
              const data = msgpack.decode(d.content).data
              const listenersToCall = listeners.get(key)
              if (listenersToCall && listenersToCall.length) {
                listenersToCall.forEach(listener => listener.callback(data))
              }
            })
          }
          rabbitUnsubscribe = (key: string) => {
            channel.cancel(key)
          }
          resolve(new PubSub(on, publish))
        })
      })
      .catch(e => {
        reject(e)
      })
  })
}

export default RabbitMQ
