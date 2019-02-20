/**
 * List of actions sent from the server
 */

const SeverActions = {
  clientIdSet: 'CLIENT_ID_SET',
  joinedRoom: 'blueboat_JOINED_ROOM',
  currentState: 'blueboat_CURRENT_STATE',
  statePatch: 'STATE_PATCH',
  removedFromRoom: 'blueboat_REMOVED_FROM_ROOM',
  availableRooms: 'blueboat_AVAILABLE_ROOMS'
}

export default SeverActions
