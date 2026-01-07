import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class InviteAdminDto {
  @ApiProperty({
    example: 'newadmin@serenagreen.com',
    description: 'Email address of the person to invite',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    enum: ['SUPER_ADMIN', 'ADMIN'],
    default: 'ADMIN',
    description: 'Role to assign to the new admin',
    required: false,
  })
  @IsEnum(['SUPER_ADMIN', 'ADMIN'])
  @IsOptional()
  role?: 'SUPER_ADMIN' | 'ADMIN';
}
