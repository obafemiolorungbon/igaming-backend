import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min, Max } from 'class-validator';
import { User } from 'src/auth/schemas/user.schema';

export class JoinLobbyDto {
  @ApiProperty()
  @IsMongoId()
  lobbyId: string;
}

export class LeaderboardEntryDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  rank: number;

  @ApiProperty()
  gamesWon: number;
}

export class LeaderboardResponseDto {
  @ApiProperty({ type: [LeaderboardEntryDto] })
  leaderboard: LeaderboardEntryDto[];
}

export class LobbyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  playerCount: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  expiryTime: Date;

  @ApiProperty()
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

  @ApiProperty()
  players: Array<{ user: User; selection?: number }>;

  @ApiProperty({ default: 25 })
  timeToExpire: number;
}

export class ActiveLobbyResponseDto {
  @ApiProperty({ type: LobbyResponseDto })
  lobby: Partial<LobbyResponseDto>;
}

export class SelectNumberDto {
  @ApiProperty({ description: 'Lucky number between 1 and 10' })
  @IsNumber()
  @Min(1)
  @Max(10)
  luckyNumber: number;
}
