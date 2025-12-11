import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

enum SiteType {
  HOTEL = 'HOTEL',
  PLANTATION = 'PLANTATION',
  SOLAR_INSTALLATION = 'SOLAR_INSTALLATION',
  COMMUNITY_INITIATIVE = 'COMMUNITY_INITIATIVE',
  WASTE_FACILITY = 'WASTE_FACILITY',
  SEWAGE_PLANT = 'SEWAGE_PLANT',
  CONSERVATION = 'CONSERVATION',
}

class CoordinatesDto {
  @ApiProperty({ example: 20.5937, description: 'Latitude coordinate' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 78.9629, description: 'Longitude coordinate' })
  @IsNumber()
  lng: number;

  @ApiProperty({ example: 10, description: 'Zoom level' })
  @IsNumber()
  zoom: number;
}

export class CreateSiteDto {
  @ApiProperty({ example: 'Ranga Plantation', description: 'Site name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'ranga-plantation',
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

  @ApiProperty({
    type: Number,
    required: false,
    description: 'SubCategory ID (optional, must exist if provided)',
  })
  @IsOptional()
  @IsNumber()
  subCategoryId?: number;

  @ApiProperty({
    example: 'Karnataka',
    required: false,
    description: 'District name',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({
    example: 'Bengaluru',
    required: false,
    description: 'City name',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: 150.5,
    required: false,
    description: 'Site area in hectares',
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiProperty({
    required: false,
    description: 'Geographic coordinates',
    type: CoordinatesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @ApiProperty({
    enum: SiteType,
    description: 'Type of site',
  })
  @IsEnum(SiteType)
  @IsNotEmpty()
  siteType: SiteType;

  @ApiProperty({
    example: 'Solar panels, water management system',
    required: false,
    description: 'Infrastructure details',
  })
  @IsOptional()
  @IsString()
  infrastructure?: string;
}
