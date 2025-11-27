import { IsString, IsOptional, IsInt, IsDateString, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class UploadRasterDto {
  @ApiPropertyOptional({ description: 'Original file name' })
  @IsString()
  @IsOptional()
  originalFileName?: string;

  @ApiPropertyOptional({ description: 'Site ID this raster belongs to' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  siteId?: number;

  @ApiPropertyOptional({ description: 'Site name (if no siteId)' })
  @IsString()
  @IsOptional()
  siteName?: string;

  @ApiPropertyOptional({ description: 'Date when imagery was captured' })
  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @ApiPropertyOptional({ description: 'Is this a classified raster?' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isClassified?: boolean;

  @ApiPropertyOptional({ description: 'Classification pixel counts (JSON string)', example: '{"TreeCanopy":2500,"Water":500}' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  classifications?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Description/notes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization (comma-separated or array)', type: [String] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(t => t.trim());
    }
    return value;
  })
  tags?: string[];
}
