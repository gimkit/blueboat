export type OnFunction = (
  key: string,
  callback: (data: string) => any
) => { unsubscribe: () => any }
export type Publish = (key: string, data: string) => any

class PubSub {
  public on: OnFunction
  public publish: Publish

  constructor(on: OnFunction, publish: Publish) {
    this.on = on
    this.publish = publish
  }
}

export default PubSub
