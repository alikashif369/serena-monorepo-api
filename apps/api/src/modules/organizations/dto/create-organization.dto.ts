import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Serena Hotels Group',
    description: 'Organization name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'serena-hotels-group',
    description: 'URL-friendly slug (must be unique)',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: 'Leading hospitality and conservation organization',
    required: false,
    description: 'Organization description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
