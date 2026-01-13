import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PhotoCategory {
  EVENT = 'EVENT',
  SITE = 'SITE',
  SPECIES = 'SPECIES',
  COMMUNITY = 'COMMUNITY',
}

export class UploadPhotoDto {
  @ApiProperty({ 
    enum: PhotoCategory, 
    description: 'Photo category', 
    example: 'EVENT' 
  })
  @IsEnum(PhotoCategory)
  category: PhotoCategory;

  @ApiPropertyOptional({ description: 'Site ID (required for EVENT/SITE photos)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  siteId?: number;

  @ApiPropertyOptional({ description: 'Species ID (required for SPECIES photos)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  speciesId?: number;

  @ApiPropertyOptional({ description: 'Year (for EVENT/SITE photos)', example: 2024 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({ description: 'Latitude (geotagging)', example: 35.3095 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (geotagging)', example: 75.6927 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Caption', example: 'Tree planting event' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Tags for categorization (comma-separated or array)', 
    type: [String] 
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(t => t.trim());
    }
    return value;
  })
  tags?: string[];

  @ApiProperty({ 
    type: 'string', 
    format: 'binary', 
    description: 'Photo file (JPEG/PNG)' 
  })
  file: any;
}
