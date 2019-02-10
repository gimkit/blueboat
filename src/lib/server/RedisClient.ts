import Redis from 'redis';

interface RedisClientOptions {
  clientOptions?: Redis.ClientOpts;
  customPrefix?: string;
}

class RedisClient {
  public client: Redis.RedisClient;
  public prefix: string;

  constructor(options: RedisClientOptions) {
    this.prefix = options.customPrefix || 'blueboat';
    this.client = Redis.createClient(options.clientOptions);
    this.client.on('error', (e: any) => {
      throw new Error(e);
    });
  }

  public set(key: string, value: string) {
    return new Promise((resolve, reject) => {
      this.client.set(this.getKey(key), value, (err, response) => {
        if (err) {
          reject(
            new Error(
              this.getKey(key) + ' - failed to set value - ' + err.message
            )
          );
        } else {
          resolve(response);
        }
      });
    });
  }

  public get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(this.getKey(key), (err, response) => {
        if (err || !response) {
          if (err && err.message) {
            reject(err.message);
          }
          reject(this.getKey(key) + ' - No data received');
        } else {
          resolve(response);
        }
      });
    });
  }

  private getKey = (key: string) => this.prefix + key;
}

export default RedisClient