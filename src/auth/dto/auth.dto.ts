/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString({ message: 'Username is required' })
  @IsNotEmpty({ message: 'Please provide a valid username' })
  username: string;

  @ApiProperty()
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password: string;
}

export class RegisterDto extends LoginDto {}

export class AuthResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    username: string;
  };
}
