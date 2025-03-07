import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PointHistoryDocument = PointHistory & Document;

@Schema({ timestamps: true })
export class PointHistory {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true })
  points: number;

  @Prop({ required: true })
  type: 'win' | 'achievement' | 'bonus';

  @Prop()
  description: string;
}

export const PointsHistorySchema = SchemaFactory.createForClass(PointHistory);
