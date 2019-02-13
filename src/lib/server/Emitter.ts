import io from 'socket.io-emitter'
import RedisClient from "./RedisClient";

const Emitter = (redis: RedisClient) => {
  return io(redis.client) as SocketIO.Server
}

export default Emitter