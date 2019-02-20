import { Client, Room } from '../index'
import State from './State'

class ChatRoom extends Room<State> {
  public onCreate() {
    this.setState(new State())
  }

  // @ts-ignore
  public onMessage(client: Client, message: any) {
    const { action, data } = message
    if (!action) {
      return
    }
    if (action === 'CHAT') {
      this.state.messages.push({ message: data, senderId: client.id })
    }
  }
}

export default ChatRoom
