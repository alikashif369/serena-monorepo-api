import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategorySummaryDto {
  @ApiPropertyOptional({ description: 'Organization ID (set one of: organizationId, regionId, categoryId)' })
  @IsOptional()
  @IsInt()
  organizationId?: number;

  @ApiPropertyOptional({ description: 'Region ID (set one of: organizationId, regionId, categoryId)' })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @ApiPropertyOptional({ description: 'Category ID (set one of: organizationId, regionId, categoryId)' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Title/heading for the summary' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Long-form text summary/description' })
  @IsString()
  summary: string;

  @ApiPropertyOptional({ description: 'Display order (lower numbers appear first)', default: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
