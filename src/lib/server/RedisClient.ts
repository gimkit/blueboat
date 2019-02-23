import Redis from 'redis'

const threeHours = 60 * 60 * 3
const fiveYears = 60 * 60 * 24 * 365 * 5

interface RedisClientOptions {
  clientOptions?: Redis.ClientOpts
  customPrefix?: string
}

class RedisClient {
  public client: Redis.RedisClient
  public prefix: string

  constructor(options: RedisClientOptions) {
    this.prefix = options.customPrefix || 'blueboat-'
    this.client = Redis.createClient(options.clientOptions)
    this.client.on('error', (e: any) => {
      throw new Error(e)
    })
  }

  public set(key: string, value: string, noExpiration?: boolean) {
    return new Promise((resolve, reject) => {
      this.client.set(
        this.getKey(key),
        value,
        'EX',
        noExpiration ? fiveYears : threeHours,
        (err, response) => {
          if (err) {
            reject(
              new Error(
                this.getKey(key) + ' - failed to set value - ' + err.message
              )
            )
          } else {
            resolve(response)
          }
        }
      )
    })
  }

  public get(key: string, resolveIfNoData?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.get(this.getKey(key), (err, response) => {
        if (err || !response) {
          if (err && err.message) {
            reject(err.message)
          }
          if (resolveIfNoData) {
            resolve(null)
          } else {
            reject(this.getKey(key) + ' - No data received')
          }
        } else {
          resolve(response)
        }
      })
    })
  }

  private getKey = (key: string) => this.prefix + key
}

export default RedisClient
