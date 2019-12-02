import Clock from '@gamestdio/timer'
import { EntityMap } from '../..'

class InternalClock {
  public loop: any
  public clock: Clock

  public handlers: EntityMap<[{ callback: () => any }]> = {}
  constructor() {
    this.clock = new Clock(false)
    this.loop = setInterval(this.tickClock, 1000 / 60)
  }

  public at = (date: Date, callback: () => any) => {
    const unix = Math.round(date.getTime() / 1000)
    const currentUnix = Math.round(new Date().getTime() / 1000)
    if (currentUnix > unix) {
      return
    } // we don't need to keep track of events in the past
    if (this.handlers[unix]) {
      this.handlers[unix].push({ callback })
    } else {
      this.handlers[unix] = [{ callback }]
    }
  }

  public tickClock = () => {
    this.clock.tick()
    const unixTime = Math.round(this.clock.currentTime / 1000)
    if (this.handlers[unixTime]) {
      this.handlers[unixTime].forEach(handler => handler.callback())
      this.handlers[unixTime] = undefined
    }
  }
  public dispose = () => clearInterval(this.loop)
}

export default InternalClock
