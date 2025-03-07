import { ApiProperty } from '@nestjs/swagger';

interface GamePoints {
  won: number;
  lost: number;
  total: number;
}

export class UserProfileResponseDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  games: GamePoints;
}

export class UserPointsResponseDto {
  @ApiProperty()
  points: number;
}
