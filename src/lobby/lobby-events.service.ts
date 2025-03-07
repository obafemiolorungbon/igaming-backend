import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface LobbyEvent {
  type: 'timer' | 'playerJoined' | 'expired' | 'newLobby';
  data: any;
  timestamp: Date;
}

@Injectable()
export class LobbyEventsService {
  private events = new Subject<LobbyEvent>();

  subscribe(callback: (event: LobbyEvent) => void) {
    return this.events.subscribe(callback);
  }

  emit(event: LobbyEvent) {
    this.events.next(event);
  }

  emitTimer(remainingSeconds: number) {
    this.emit({
      type: 'timer',
      data: { remainingSeconds },
      timestamp: new Date(),
    });
  }

  emitPlayerJoined(username: string, playerCount: number) {
    this.emit({
      type: 'playerJoined',
      data: { username, playerCount },
      timestamp: new Date(),
    });
  }

  emitExpired(winningNumber: number) {
    this.emit({
      type: 'expired',
      data: { winningNumber },
      timestamp: new Date(),
    });
  }

  emitNewLobby(lobbyId: string, startTime: Date, expiryTime: Date) {
    this.emit({
      type: 'newLobby',
      data: { lobbyId, startTime, expiryTime },
      timestamp: new Date(),
    });
  }
}
