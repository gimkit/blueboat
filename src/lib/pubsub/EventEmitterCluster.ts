import cluster from 'cluster'
import nanoid from 'nanoid'

// @ts-ignore
// tslint:disable-next-line
const ClusterMaster = require('socket.io-adapter-cluster/master')

// @ts-ignore
// tslint:disable-next-line
export const ClusterAdapter = require('socket.io-adapter-cluster') as () => SocketIO.Adapter

import PubSubCreator from './PubSub'

interface Callback {
  id: any
  callback: any
}

export const ProcessStarter = (
  startFunction: any,
  numberOfWorkers: number,
  options?: any
) => {
  if (cluster.isWorker) {
    const processOptions = JSON.parse(process.env.blueboatGameValues || "{}")
    startFunction(processOptions)
  }
  if (cluster.isMaster) {
    const workers = [] as cluster.Worker[]
    const envVariables = {
      blueboatGameValues: options ? JSON.stringify(options) : "{}"
    }
    for (let i = 0; i < numberOfWorkers; i++) {
      const worker = cluster.fork(envVariables)
      workers.push(worker)
      worker.on('message', message => {
        if (message.key) {
          workers.forEach(w => {
            if (w.isConnected) {
              w.send(message)
            }
          })
        }
      })
    }
    ClusterMaster()
  }
}

export const PubSub = () => {
  const listeners = new Map<string, Callback[]>()

  process.on('message', (data: any) => {
    const callbacks = listeners.get(data.key)
    if (callbacks && callbacks.length) {
      callbacks.forEach(callback => {
        callback.callback(data.data)
      })
    }
  })

  const on = (key: string, callback: (data: string) => any) => {
    const alreadyListeningForKey = listeners.has(key)
    const id = nanoid()
    if (!alreadyListeningForKey) {
      listeners.set(key, [{ id, callback }])
    } else {
      const currentListeners = listeners.get(key)
      // @ts-ignore
      const newListeners: Callback[] = currentListeners.push({ id, callback })
      listeners.set(key, newListeners)
    }
    return { unsubscribe: () => unsubscribe(key, id) }
  }

  const publish = (key: string, data: any) => {
    process.send({ key, data })
    return
  }

  const unsubscribe = (key: string, id: string) => {
    const listenersForKey = listeners.get(key)
    if (!listenersForKey || !listenersForKey.length) {
      return
    }
    if (listenersForKey.length === 1) {
      listeners.delete(key)
    } else {
      const newListeners = listenersForKey.filter(l => l.id !== id)
      listeners.set(key, newListeners)
    }
  }

  return new PubSubCreator(on, publish)
}
