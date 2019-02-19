import Client from './lib/room/Client'
import Room from './lib/room/Room'
import Server from './lib/server/Server'

export interface EntityMap<T> {
  [entityId: string]: T;
}

export { nonenumerable as nosync } from 'nonenumerable'

export {Server, Room, Client}