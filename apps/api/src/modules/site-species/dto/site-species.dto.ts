import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AddSpeciesToSiteDto {
  @ApiProperty({ description: 'Species ID', example: 1 })
  @IsInt()
  speciesId: number;

  @ApiPropertyOptional({ description: 'Number of plants', example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  plantedCount?: number;

  @ApiPropertyOptional({ description: 'Year planted', example: 2023 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  plantedYear?: number;
}

export class UpdateSiteSpeciesDto {
  @ApiPropertyOptional({ description: 'Number of plants', example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  plantedCount?: number;

  @ApiPropertyOptional({ description: 'Year planted', example: 2023 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  plantedYear?: number;
}
