import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Points, PointsDocument } from './schemas/points.schema';
import {
  PointHistory,
  PointHistoryDocument,
} from './schemas/point-history.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Points.name) private pointsModel: Model<PointsDocument>,
    @InjectModel(PointHistory.name)
    private pointHistoryModel: Model<PointHistoryDocument>,
  ) {}

  async getUserProfile(username: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserPoints(username: string): Promise<PointsDocument> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pointsRecord = await this.pointsModel
      .findOne({ userId: user._id })
      .populate('userId', 'username')
      .exec();

    if (!pointsRecord) {
      return this.pointsModel.create({ userId: user._id });
    }

    return pointsRecord;
  }

  async getTopPlayers(limit = 10): Promise<PointsDocument[]> {
    return this.pointsModel
      .find()
      .sort({ gamesWon: -1 })
      .limit(limit)
      .populate('userId', 'username')
      .exec();
  }

  async updateUserPoints(
    username: string,
    pointsEarned: number,
    gameStats: {
      isWinner: boolean;
    },
  ): Promise<void> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create points record
    let pointsRecord = await this.pointsModel.findOne({ userId: user._id });
    if (!pointsRecord) {
      pointsRecord = await this.pointsModel.create({ userId: user._id });
    }

    // Update points and stats
    pointsRecord.totalPoints += pointsEarned;
    pointsRecord.gamesPlayed += 1;
    if (gameStats.isWinner) {
      pointsRecord.gamesWon += 1;
    }

    await pointsRecord.save();

    // Record point history
    await this.pointHistoryModel.create({
      userId: user._id,
      points: pointsEarned,
      type: gameStats.isWinner ? 'win' : 'participation',
      description: `Earned ${pointsEarned} points from game ${gameStats.isWinner ? '(Winner)' : ''}`,
    });

    // Update rankings
    await this.updateRankings();
  }

  private async updateRankings(): Promise<void> {
    const allPoints = await this.pointsModel
      .find()
      .sort({ totalPoints: -1 })
      .exec();

    // Update rank for each player
    for (let i = 0; i < allPoints.length; i++) {
      allPoints[i].rank = i + 1;
      await allPoints[i].save();
    }
  }

  async getPointHistory(username: string): Promise<PointHistoryDocument[]> {
    const user = await this.getUserProfile(username);
    return this.pointHistoryModel
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserStats(username: string): Promise<{
    points: PointsDocument;
    history: PointHistoryDocument[];
  }> {
    const points = await this.getUserPoints(username);
    const history = await this.getPointHistory(username);
    return { points, history };
  }
}
