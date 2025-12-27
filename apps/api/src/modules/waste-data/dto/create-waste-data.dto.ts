import { IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWasteDataDto {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  siteId: number;

  @ApiProperty({ description: 'Year of the data', example: 2023 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Organic waste processed (kg)', example: 5000.0 })
  @IsNumber()
  @Min(0)
  organicWaste: number;

  @ApiProperty({ description: 'Compost received/produced (kg)', example: 2500.0 })
  @IsNumber()
  @Min(0)
  compostReceived: number;

  @ApiPropertyOptional({ description: 'Methane recovered (m³)', example: 150.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  methaneRecovered?: number;
}
