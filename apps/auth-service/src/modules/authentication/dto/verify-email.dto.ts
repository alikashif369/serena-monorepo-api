import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@serenagreen.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @IsNotEmpty()
  verificationCode: number;
}
