import { IsString, IsNumber, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({ example: 'South India', description: 'Region name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'south-india',
    description: 'URL-friendly slug (must be unique within organization, lowercase alphanumeric with hyphens only)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    type: Number,
    description: 'Organization ID (must exist)',
  })
  @IsNumber()
  @IsNotEmpty()
  organizationId: number;
}
