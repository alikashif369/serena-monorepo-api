import { IsEnum, IsInt, IsNumber, IsString, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetricType } from '@prisma/client';

export class CreateAggregateMetricDto {
  @ApiProperty({
    enum: ['ORGANIZATION', 'REGION', 'CATEGORY'],
    description: 'Level at which this metric applies'
  })
  @IsEnum(['ORGANIZATION', 'REGION', 'CATEGORY'])
  entityType: 'ORGANIZATION' | 'REGION' | 'CATEGORY';

  @ApiPropertyOptional({ description: 'Organization ID (required if entityType is ORGANIZATION)' })
  @IsOptional()
  @IsInt()
  organizationId?: number;

  @ApiPropertyOptional({ description: 'Region ID (required if entityType is REGION)' })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @ApiPropertyOptional({ description: 'Category ID (required if entityType is CATEGORY)' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiProperty({
    enum: [
      'PLANTATION_TARGET',
      'PLANTATION_ACHIEVED',
      'PLANTATION_STEWARDSHIP_TARGET',
      'PLANTATION_STEWARDSHIP_ACHIEVED',
      'SOLAR_CAPACITY_TOTAL',
      'SOLAR_PRODUCTION_ANNUAL',
      'SOLAR_PRODUCTION_CUMULATIVE',
      'COMMUNITY_STOVES',
      'COMMUNITY_SEEDS_FODDER',
      'COMMUNITY_SEEDS_KITCHEN',
      'COMMUNITY_SOLAR_GEYSERS',
      'WASTE_ORGANIC_TOTAL',
      'WASTE_COMPOST_TOTAL',
      'SEWAGE_RECOVERY_TOTAL',
      'CUSTOM'
    ],
    description: 'Type of metric'
  })
  @IsEnum([
    'PLANTATION_TARGET',
    'PLANTATION_ACHIEVED',
    'PLANTATION_STEWARDSHIP_TARGET',
    'PLANTATION_STEWARDSHIP_ACHIEVED',
    'SOLAR_CAPACITY_TOTAL',
    'SOLAR_PRODUCTION_ANNUAL',
    'SOLAR_PRODUCTION_CUMULATIVE',
    'COMMUNITY_STOVES',
    'COMMUNITY_SEEDS_FODDER',
    'COMMUNITY_SEEDS_KITCHEN',
    'COMMUNITY_SOLAR_GEYSERS',
    'WASTE_ORGANIC_TOTAL',
    'WASTE_COMPOST_TOTAL',
    'SEWAGE_RECOVERY_TOTAL',
    'CUSTOM'
  ])
  metricType: MetricType;

  @ApiPropertyOptional({ description: 'Start year for multi-year targets' })
  @IsOptional()
  @IsInt()
  @Min(2000)
  startYear?: number;

  @ApiPropertyOptional({ description: 'End year for multi-year targets' })
  @IsOptional()
  @IsInt()
  @Min(2000)
  endYear?: number;

  @ApiPropertyOptional({ description: 'Single year for annual metrics' })
  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ description: 'Target value' })
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Achieved/actual value' })
  @IsOptional()
  @IsNumber()
  achievedValue?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement (e.g., trees, kWh, units, kg)', example: 'trees' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Human-readable label for display', example: 'WWF Total Target (2021-2023)' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Display order (lower numbers appear first)', default: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON', example: { locations: ['Mohra', 'Sherani'] } })
  @IsOptional()
  @IsObject()
  details?: any;
}
