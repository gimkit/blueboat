/**
 * List of actions sent from the client
 */

const ClientActions = {
  createNewRoom: 'blueboat_CREATE_NEW_ROOM',
  joinRoom: 'blueboat_JOIN_ROOM',
  sendMessage: 'blueboat_SEND_MESSAGE',
  listen: 'blueboat_LISTEN_STATE',
  requestAvailableRooms: 'blueboat_AVAILABLE_ROOMS',
  ping: 'blueboat-ping'
}

export default ClientActions
