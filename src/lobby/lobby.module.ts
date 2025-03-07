import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LobbyController } from './lobby.controller';
import { LobbyService } from './lobby.service';
import { Lobby, LobbySchema } from './schemas/lobby.schema';
import { UserModule } from 'src/user/user.module';
import { LobbyEventsService } from './lobby-events.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lobby.name, schema: LobbySchema }]),
    UserModule,
  ],
  controllers: [LobbyController],
  providers: [LobbyService, LobbyEventsService],
  exports: [LobbyService],
})
export class LobbyModule {}
