import SimpleClient from "./SimpleClient";

export interface RoomSnapshot {
  id: string
  type: string
  owner: SimpleClient
  metadata: any
  createdAt: number
}