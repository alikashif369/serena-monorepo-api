import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceInfo: string;
}
