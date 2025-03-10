/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lobby, LobbyDocument } from './schemas/lobby.schema';
import {
  LobbyResponseDto,
  ActiveLobbyResponseDto,
  SelectNumberDto,
  LeaderboardResponseDto,
} from './dto/lobby.dto';
import { LobbyEventsService } from './lobby-events.service';
import { UserService } from '../user/user.service';
import { LOBBY_STATUS } from './constants';

@Injectable()
export class LobbyService {
  private currentLobby: LobbyDocument | null = null;
  private timerInterval: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(Lobby.name) private lobbyModel: Model<LobbyDocument>,
    private readonly eventsService: LobbyEventsService,
    private readonly userService: UserService,
  ) {
    this.startNewLobby();
  }

  private generateWinningNumber(): number {
    return Math.floor(Math.random() * 10) + 1;
  }

  async startNewLobby(): Promise<void> {
    const startTime = new Date();
    const expiryTime = new Date(startTime.getTime() + 25000);

    this.currentLobby = await this.lobbyModel.create({
      winningNumber: this.generateWinningNumber(),
      startTime,
      expiryTime,
      players: [],
      playerCount: 0,
      status: LOBBY_STATUS.ACTIVE,
    });

    this.eventsService.emitNewLobby(
      this.currentLobby.id,
      startTime,
      expiryTime,
    );

    this.startTimer();
    setTimeout(() => {
      void this.expireLobby();
    }, 25000);
  }

  private startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (!this.currentLobby) return;

      const now = new Date();
      const remainingTime =
        this.currentLobby.expiryTime.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.floor(remainingTime / 1000));

      this.eventsService.emitTimer(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(this.timerInterval!);
      }
    }, 1000);
  }

  async joinLobby(username: string): Promise<LobbyResponseDto> {
    if (!this.currentLobby) {
      throw new BadRequestException('No active Game Session');
    }

    if (this.currentLobby.status !== LOBBY_STATUS.ACTIVE) {
      throw new BadRequestException('This Session is no longer active');
    }

    if (this.currentLobby.expiryTime < new Date()) {
      throw new BadRequestException('This Session is no longer active');
    }

    // TODO: implement logic
    const isAlreadyInLobby = this.currentLobby.players.some(
      (player) => player.user.username === username,
    );

    if (isAlreadyInLobby) {
      throw new BadRequestException('You are already in the lobby');
    }
    // get user
    const User = await this.userService.getUserProfile(username);

    try {
      this.currentLobby.players.push({ user: User });
      this.currentLobby.playerCount += 1;
      await this.currentLobby.save();
    } catch (__) {
      throw new BadRequestException('Error joining lobby');
    }

    this.eventsService.emitPlayerJoined(
      username,
      this.currentLobby.playerCount,
    );

    return this.buildLobbyResponse(this.currentLobby, username);
  }

  getActiveLobby(username: string): ActiveLobbyResponseDto {
    if (!this.currentLobby) {
      return { lobby: {} };
    }

    return {
      lobby: this.buildLobbyResponse(this.currentLobby, username),
    };
  }

  async selectNumber(
    username: string,
    selectNumberDto: SelectNumberDto,
  ): Promise<LobbyResponseDto> {
    if (!this.currentLobby) {
      throw new BadRequestException(
        'No active lobby. Please wait for the next round.',
      );
    }

    if (this.currentLobby.status !== LOBBY_STATUS.ACTIVE) {
      throw new BadRequestException('Lobby is not active');
    }

    if (this.currentLobby.status === LOBBY_STATUS.EXPIRED) {
      throw new BadRequestException('Lobby has expired');
    }

    if (
      !this.currentLobby.players.some(
        (player) => player.user.username === username,
      )
    ) {
      throw new BadRequestException('You must join the lobby first');
    }

    // Update user selection
    const userIndex = this.currentLobby.players.findIndex(
      (player) => player.user.username === username,
    );

    this.currentLobby.players[userIndex].selection =
      selectNumberDto.luckyNumber;

    await this.currentLobby.save();

    return this.buildLobbyResponse(
      this.currentLobby,
      username,
      selectNumberDto.luckyNumber,
    );
  }

  private async expireLobby(): Promise<void> {
    if (!this.currentLobby) return;

    this.currentLobby.status = LOBBY_STATUS.EXPIRED;
    this.currentLobby.isExpired = true;
    await this.currentLobby.save();

    this.eventsService.emitExpired(this.currentLobby.winningNumber);

    await this.awardPoints();

    // wait for 5 seconds before starting a new lobby
    setTimeout(() => {
      void this.startNewLobby();
    }, 5000);
  }

  private async awardPoints(): Promise<void> {
    if (!this.currentLobby) return;

    // Award points to all players who selected had a winning number
    for (const User of this.currentLobby.players) {
      if (!User.selection) {
        continue;
      }
      const wonRound = User.selection === this.currentLobby.winningNumber;

      await this.userService.updateUserPoints(User.user.username, 1, {
        isWinner: wonRound,
      });
    }
  }

  async getLeaderboard(): Promise<LeaderboardResponseDto> {
    const leaderboard = await this.userService.getTopPlayers(10);

    return {
      leaderboard: leaderboard.map((entry, index) => ({
        username: entry.userId.username,
        points: entry.totalPoints,
        gamesWon: entry.gamesWon,
        rank: index + 1,
      })),
    };
  }

  private buildLobbyResponse(
    lobby: LobbyDocument,
    user: string,
    selectedNumber?: number,
  ): LobbyResponseDto & { canJoin: boolean; selectedNumber?: number } {
    let canJoin = true;

    if (lobby.status === LOBBY_STATUS.EXPIRED) {
      canJoin = false;
    }

    if (lobby.players.some((player) => player.user.username === user)) {
      canJoin = false;
    }

    return {
      id: lobby.id,
      playerCount: lobby.playerCount,
      startTime: lobby.startTime,
      expiryTime: lobby.expiryTime,
      status: lobby.status,
      players: lobby.players,
      timeToExpire: 25,
      canJoin,
      selectedNumber,
    };
  }
}
