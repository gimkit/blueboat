import { Client, Room } from '../index'
import State from './State'

class ChatRoom extends Room<State> {
  public onCreate() {
    this.setState(
      new State(
        this.initialGameValues.initialBotMessage || 'Welcome to the chat!'
      )
    )
  }

  public async onMessage(client: Client, action: string, data?: any) {
    if (!action) {
      return
    }
    if (action === 'CHAT') {
      this.state.messages.push({ message: data, senderId: client.id })
    }
  }

  public async beforeDispose() {
    this.broadcast('DISPOSED')
  }

  public onLeave = async (client: Client) => {
    const reconneced = await this.allowReconnection(client, 10)
    if (reconneced) {
      return
    }
    this.state.messages.push({
      message: `${client.id} has left the room`,
      senderId: 'Botsy'
    })
  }
}

export default ChatRoom
