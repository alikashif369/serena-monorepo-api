import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({ example: 'South India', description: 'Region name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'south-india',
    description: 'URL-friendly slug (must be unique within organization)',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    type: Number,
    description: 'Organization ID (must exist)',
  })
  @IsNumber()
  @IsNotEmpty()
  organizationId: number;
}
