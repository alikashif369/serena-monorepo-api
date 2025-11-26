import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { UserRole } from '@notiz/auth';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  assignedSites?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fileUrl?: string;
}
