import Clock from '@gamestdio/timer'

class InternalClock {
  public loop: any
  public clock: Clock

  public handlers: Array<{ time: number; callback: () => any }> = []
  constructor() {
    this.clock = new Clock(false)
    this.loop = setInterval(this.tickClock, 1000 / 60)
  }

  // Schedule an event to run at a certain date/time
  public at = (date: Date, callback: () => any) => {
    const eventTime = Math.round(date.getTime() / 1000)
    const currentUnix = this.clock.currentTime / 1000

    // Only keep track of events in the future
    if (currentUnix < eventTime) {
      this.handlers.push({
        time: eventTime,
        callback
      })
    }
  }

  public tickClock = () => {
    // Tick the clock
    this.clock.tick()

    // Check and run any scheduled events
    const currentTime = Math.round(this.clock.currentTime / 1000)

    // Run the callback at the earliest possible time
    // which could be at or after the specified time
    this.handlers.forEach(handler => {
      if (currentTime >= handler.time) {
        handler.callback()
      }
    })

    // Keep all the handlers that haven't run yet
    this.handlers = this.handlers.filter(handler => currentTime < handler.time)
  }

  public dispose = () => clearInterval(this.loop)
}

export default InternalClock
