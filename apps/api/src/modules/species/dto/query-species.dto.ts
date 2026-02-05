import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class QuerySpeciesDto {
  @ApiPropertyOptional({
    description: 'Search by code, botanical name, local name, or English name',
    example: 'neem',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Search query must not exceed 200 characters' })
  search?: string;
}
