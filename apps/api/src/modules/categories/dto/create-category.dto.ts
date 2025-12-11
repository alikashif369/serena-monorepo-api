import { IsString, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Plantation Sites', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'plantation-sites',
    description: 'URL-friendly slug (must be unique within region)',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    enum: CategoryType,
    description: 'Type of category',
  })
  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;

  @ApiProperty({
    type: Number,
    description: 'Region ID (must exist)',
  })
  @IsNumber()
  @IsNotEmpty()
  regionId: number;
}
