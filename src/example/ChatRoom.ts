import { Client, Room } from '../index'
import State from './State'

class ChatRoom extends Room<State> {
  public onCreate() {
    this.setState(new State())
  }

  public onMessage(client: Client, action: string, data?: any) {
    if (!action) {
      return
    }
    if (action === 'CHAT') {
      this.state.messages.push({ message: data, senderId: client.id })
    }
  }
}

export default ChatRoom
