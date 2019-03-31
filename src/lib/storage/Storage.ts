type GetFunction = (key: string, resolveIfNoData?: boolean) => Promise<string>
type SetFunction = (key: string, value: string, options?: any) => Promise<void>
type RemoveFunction = (key: string) => Promise<void>
type FetchKeysFunction = (keyPrefix: string) => Promise<string[]>

class Storage {
  public get: GetFunction
  public set: SetFunction
  public remove: RemoveFunction
  public fetchKeys: FetchKeysFunction

  constructor(
    get: GetFunction,
    set: SetFunction,
    remove: RemoveFunction,
    fetch: FetchKeysFunction
  ) {
    this.get = get
    this.set = set
    this.remove = remove
    this.fetchKeys = fetch
  }
}

export default Storage
