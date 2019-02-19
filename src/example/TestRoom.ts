import { Client, Room } from '../index'
import State from './State'

class TestRoom extends Room<State> {
  public onCreate() {
    this.setState(new State())
    setTimeout(() => (this.state.name = 'woah!'), 500)
  }

  // @ts-ignore
  public onMessage(client: Client, message: any) {
    const { action, payload } = message
    if (!action) {
      return
    }
    if (action === 'ADD_PLAYER') {
      this.state.players[payload.name] = payload.age
    }
  }
}

export default TestRoom
