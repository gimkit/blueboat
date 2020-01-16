interface Call {
  callback: (e?: any, e2?: any) => void
  timesCalled: number
  canCallMultipleTimes: boolean
  id: string
}

class Callback {
  public callbacks: Call[] = []

  public add(callback: (e?: any, e2?: any) => void, onlyCallOnce?: boolean) {
    const id = Math.random().toString()
    this.callbacks.push({
      callback,
      timesCalled: 0,
      canCallMultipleTimes: !onlyCallOnce,
      id
    })
    return { clear: () => this.removeCallback(id) }
  }

  public clear() {
    this.callbacks.splice(0, this.callbacks.length)
  }

  public call(argument?: any, argument2?: any) {
    this.callbacks = this.callbacks.map(callback => {
      if (callback.timesCalled > 0) {
        if (!callback.canCallMultipleTimes) {
          return callback
        }
      }
      callback.callback(argument, argument2)
      return {
        ...callback,
        timesCalled: callback.timesCalled + 1
      }
    })
  }

  private removeCallback = (id: string) => {
    this.callbacks = this.callbacks.filter(callback => callback.id !== id)
  }
}
export default Callback
