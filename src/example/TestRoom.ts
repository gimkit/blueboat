import faker from 'faker'
import Room from '../lib/room/Room'

interface State {
  name: string
}

class TestRoom extends Room<State> {
  public onCreate() {
    this.setState({ name: faker.name.firstName() })
    this.clock.setInterval(() => {
      this.state.name = faker.name.firstName()
    }, 250)
  }
}

export default TestRoom
