interface Message {
  message: string
  senderId: string
}

class State {
  public messages: Message[]

  constructor(initialMessage: string) {
    this.messages = [{ message: initialMessage, senderId: 'Botsy' }]
  }
}

export default State
