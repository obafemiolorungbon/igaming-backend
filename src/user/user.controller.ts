import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UserProfileResponseDto, UserPointsResponseDto } from './dto/user.dto';
import { UserReq } from '../types';

@ApiTags('User')
@Controller('user')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  // TODO: Fix type
  async getUserProfile(@Req() req: UserReq): Promise<UserProfileResponseDto> {
    const user = await this.userService.getUserProfile(req.user.username);
    const points = await this.userService.getUserPoints(req.user.username);

    return {
      username: user.username,
      games: {
        won: points.gamesWon,
        lost: points.gamesPlayed - points.gamesWon,
        total: points.gamesPlayed,
      },
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top players' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Top players retrieved successfully',
  })
  async getTopPlayers(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.userService.getTopPlayers(limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@Req() req: UserReq) {
    return this.userService.getUserStats(req.user.username);
  }

  // @Get('points')
  // @ApiOperation({ summary: 'Get user points' })
  // @ApiResponse({ status: 200, type: UserPointsResponseDto })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async getUserPoints(@Req() req: UserReq): Promise<UserPointsResponseDto> {
  //   return this.userService.getUserPoints(req.user.username);
  // }

  @Get('points/history')
  @ApiOperation({ summary: 'Get user point history' })
  @ApiResponse({
    status: 200,
    description: 'Point history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPointHistory(@Req() req: UserReq) {
    return this.userService.getPointHistory(req.user.username);
  }
}
