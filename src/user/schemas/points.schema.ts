import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

export type PointsDocument = Points & Document;

@Schema({ timestamps: true })
export class Points {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: User;

  @Prop({ required: true, default: 0 })
  totalPoints: number;

  @Prop({ required: true, default: 0 })
  gamesPlayed: number;

  @Prop({ required: true, default: 0 })
  gamesWon: number;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }] })
  achievements: { title: string; earnedAt: Date }[];

  @Prop({ default: 0 })
  rank: number;
}

export const PointsSchema = SchemaFactory.createForClass(Points);
