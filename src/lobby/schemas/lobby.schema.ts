import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { LOBBY_STATUS_TYPES } from 'src/types';

export type LobbyDocument = Lobby & Document;

@Schema({ timestamps: true })
export class Lobby {
  @Prop({ required: true })
  winningNumber: number;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  expiryTime: Date;

  @Prop({
    type: [
      {
        user: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
        selection: {
          type: Number,
          min: 1,
          max: 10,
        },
      },
    ],
  })
  players: Array<{ user: User; selection?: number }>;

  @Prop({ default: 0 })
  playerCount: number;

  @Prop({ default: false })
  isExpired: boolean;

  @Prop({ default: 'ACTIVE' })
  status: LOBBY_STATUS_TYPES;
}

export const LobbySchema = SchemaFactory.createForClass(Lobby);
