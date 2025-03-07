import { Request } from 'express';

export interface UserPayload {
  id: string;
  username: string;
}

export interface UserReq extends Request {
  user: UserPayload;
}

export type LOBBY_STATUS_TYPES = 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
