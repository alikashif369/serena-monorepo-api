import { IsString, IsNumber, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubCategoryDto {
  @ApiProperty({ example: 'Organic Plantations', description: 'SubCategory name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'organic-plantations',
    description: 'URL-friendly slug (must be unique within category, lowercase alphanumeric with hyphens only)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    type: Number,
    description: 'Category ID (must exist)',
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;
}
