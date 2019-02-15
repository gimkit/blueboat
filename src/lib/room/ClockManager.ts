import Clock from './Clock'

class ClockManager {
  public clocks: Clock[] = []

  public setTimeout = (callback: () => any, ms: number) => {
    const clock = new Clock()
    clock.setTimeout(callback, ms)
    this.clocks.push(clock)
    return clock
  }

  public setInterval = (callback: () => any, ms: number) => {
    const clock = new Clock()
    clock.setInterval(callback, ms)
    this.clocks.push(clock)
    return clock
  }

  public dispose = () => {
    this.clocks.forEach(clock => clock.dispose())
  }
}

export default ClockManager
