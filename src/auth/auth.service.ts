import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { LoginDto, RegisterDto, AuthResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { password, ...rest } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      ...rest,
      password: hashedPassword,
    });

    const token = this.generateToken(user);
    return this.buildResponse(user, token);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userModel.findOne({ username: loginDto.username });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    return this.buildResponse(user, token);
  }

  private generateToken(user: UserDocument): string {
    return this.jwtService.sign({
      sub: user.username,
      username: user.username,
    });
  }

  private buildResponse(user: UserDocument, accessToken: string): AuthResponse {
    return {
      accessToken,
      user: {
        username: user.username,
      },
    };
  }
}
