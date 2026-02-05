import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
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
    description: 'URL-friendly slug (must be unique, lowercase alphanumeric with hyphens only)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
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
