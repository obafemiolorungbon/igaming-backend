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
  @ApiResponse({ status: 500, description: 'Internal server error' })
  events(@Req() req: UserReq): Observable<LobbyEvent & { username: string }> {
    try {
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
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('leaderboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top 10 players leaderboard' })
  @ApiResponse({ status: 200, type: LeaderboardResponseDto })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLeaderboard(): Promise<LeaderboardResponseDto> {
    try {
      return this.lobbyService.getLeaderboard();
    } catch (error) {
      throw new Error(error);
    }
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
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async joinLobby(@Req() req: UserReq): Promise<LobbyResponseDto> {
    try {
      return this.lobbyService.joinLobby(req.user.username);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Post('select')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select a lucky number for the current lobby' })
  @ApiResponse({ status: 200, type: SelectNumberDto })
  @ApiResponse({ status: 400, description: 'Please Select a lucky number' })
  @ApiResponse({ status: 404, description: 'Lobby not found or not active' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async selectNumber(
    @Req() req: UserReq,
    @Body() selectNumberDto: SelectNumberDto,
  ): Promise<LobbyResponseDto> {
    try {
      return this.lobbyService.selectNumber(req.user.username, selectNumberDto);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current active lobby' })
  @ApiResponse({ status: 200, type: ActiveLobbyResponseDto })
  @ApiResponse({ status: 404, description: 'No active lobby found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getActiveLobbies(@Req() req: UserReq): ActiveLobbyResponseDto {
    try {
      return this.lobbyService.getActiveLobby(req.user.username);
    } catch (error) {
      throw new Error(error);
    }
  }
}
