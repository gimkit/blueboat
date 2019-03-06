import { EventEmitter } from 'events'

const Emitter = new EventEmitter()
Emitter.setMaxListeners(5000)

export default Emitter
