import Express from 'express';
import { Server as HTTPServer } from 'http';
import socket from 'socket.io';
import redisAdapter from 'socket.io-redis';
import RedisClient from './RedisClient';

interface RedisOptions {
  host: string;
  port: number;
  auth_pass?: string;
  requestsTimeout?: number;
}

interface ServerArguments {
  app: Express.Application;
  redisOptions: RedisOptions;
}

class Server {
  public server: HTTPServer = null;
  public redis: RedisClient = null;

  public listen: (port: number, callback: () => void) => void = null;
  private app: Express.Application = null;
  private io: SocketIO.Server = null;

  constructor(options: ServerArguments) {
    this.app = options.app;
    this.redis = new RedisClient({
      clientOptions: options.redisOptions as any
    });
    this.spawnServer(options.redisOptions);
  }

  private spawnServer = (redisOptions: RedisOptions) => {
    this.server = new HTTPServer(this.app);
    this.listen = (port: number, callback: () => void) =>
      this.server.listen(port, callback);
    this.io = socket({
      path: '/blueboat'
    });
    this.io.adapter(redisAdapter(redisOptions));
    this.io.attach(this.server, { cookie: true });
  };
}

export default Server;
