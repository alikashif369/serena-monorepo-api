import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveDeviceInfoDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceInfo: string;
}
