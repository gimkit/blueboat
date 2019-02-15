import Timer from 'nanotimer'

class Clock {
  public timer: any

  constructor() {
    this.timer = new Timer()
  }

  public setInterval(callback: () => any, ms: number) {
    this.timer.setInterval(callback, '', ms + 'm')
  }

  public setTimeout(callback: () => any, ms: number) {
    this.timer.setTimeout(callback, '', ms + 'm')
  }

  public dispose() {
    this.timer.clearTimeout()
    this.timer.clearInterval()
  }
}

export default Clock
