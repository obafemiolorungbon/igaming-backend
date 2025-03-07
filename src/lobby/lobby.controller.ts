import {
  Controller,
  Post,
  Get,
  Req,
  Sse,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SseAuthGuard } from '../auth/guards/sse-auth.guard';
import { LobbyService } from './lobby.service';
import { LobbyEvent, LobbyEventsService } from './lobby-events.service';
import {
  LobbyResponseDto,
  ActiveLobbyResponseDto,
  SelectNumberDto,
  LeaderboardResponseDto,
} from './dto/lobby.dto';
import { Observable } from 'rxjs';
import { UserReq } from '../types';

@ApiTags('Lobby')
@Controller('lobby')
export class LobbyController {
  constructor(
    private readonly lobbyService: LobbyService,
    private readonly eventsService: LobbyEventsService,
  ) {}

  @UseGuards(SseAuthGuard)
  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to lobby events' })
  @ApiQuery({
    name: 'token',
    required: true,
    type: String,
    description: 'JWT token',
  })
  events(@Req() req: UserReq): Observable<LobbyEvent & { username: string }> {
    const username = req.user.username;

    return new Observable((subscriber) => {
      const subscription = this.eventsService.subscribe((event) => {
        subscriber.next({
          ...event,
          username,
        });
      });

      // Cleanup subscription when client disconnects
      return () => {
        subscription.unsubscribe();
      };
    });
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top 10 players leaderboard' })
  @ApiResponse({ status: 200, type: LeaderboardResponseDto })
  async getLeaderboard(): Promise<LeaderboardResponseDto> {
    return this.lobbyService.getLeaderboard();
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join the current lobby' })
  @ApiResponse({ status: 200, type: LobbyResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Lobby is not active or has expired',
  })
  async joinLobby(@Req() req: UserReq): Promise<LobbyResponseDto> {
    return this.lobbyService.joinLobby(req.user.username);
  }

  @Post('select')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select a lucky number for the current lobby' })
  @ApiResponse({ status: 200, type: SelectNumberDto })
  @ApiResponse({
    status: 400,
    description: 'Please Select a lucky number',
  })
  async selectNumber(
    @Req() req: UserReq,
    @Body() selectNumberDto: SelectNumberDto,
  ): Promise<LobbyResponseDto> {
    return this.lobbyService.selectNumber(req.user.username, selectNumberDto);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active lobby' })
  @ApiResponse({ status: 200, type: ActiveLobbyResponseDto })
  getActiveLobbies(@Req() req: UserReq): ActiveLobbyResponseDto {
    const username = req.user.username;
    return this.lobbyService.getActiveLobby(username);
  }
}
