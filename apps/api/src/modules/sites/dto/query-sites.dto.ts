import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySitesDto {
  @ApiPropertyOptional({
    description: 'Search by name, slug, district, or city',
    example: 'test site',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Search query must not exceed 200 characters' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filter by site type',
    example: 'PLANTATION',
  })
  @IsOptional()
  @IsString()
  siteType?: string;
}
