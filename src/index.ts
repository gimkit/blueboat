import EventEmitterPubSub from './lib/pubsub/EventEmitter'
import * as EventEmitterClusterPubsub from './lib/pubsub/EventEmitterCluster'
import PubSub from './lib/pubsub/PubSub'
import RabbitMQPubSub from './lib/pubsub/RabbitMQ'
import RedisPubSub from './lib/pubsub/Redis'
import Client from './lib/room/Client'
import Room from './lib/room/Room'
import Server from './lib/server/Server'
import ClusterMemoryStorage from './lib/storage/ClusterMemory'
import MemoryStorage from './lib/storage/Memory'
import RedisStorage from './lib/storage/Redis'
import Storage from './lib/storage/Storage'
import SimpleClient from './types/SimpleClient'

export interface EntityMap<T> {
  [entityId: string]: T
}

export {
  Server,
  Room,
  Client,
  SimpleClient,
  PubSub,
  RedisPubSub,
  EventEmitterPubSub,
  RabbitMQPubSub,
  Storage,
  RedisStorage,
  MemoryStorage,
  EventEmitterClusterPubsub,
  ClusterMemoryStorage
}
