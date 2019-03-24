export type OnFunction = (
  key: string,
  callback: (data: any) => any
) => { unsubscribe: () => any }
export type Publish = (key: string, data: any) => any

class PubSub {
  public on: OnFunction
  public publish: Publish

  constructor(on: OnFunction, publish: Publish) {
    this.on = on
    this.publish = publish
  }
}

export default PubSub
