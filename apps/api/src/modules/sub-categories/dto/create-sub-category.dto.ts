import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubCategoryDto {
  @ApiProperty({ example: 'Organic Plantations', description: 'SubCategory name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'organic-plantations',
    description: 'URL-friendly slug (must be unique within category)',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    type: Number,
    description: 'Category ID (must exist)',
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;
}
