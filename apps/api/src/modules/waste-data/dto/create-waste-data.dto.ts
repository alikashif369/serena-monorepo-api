import { IsInt, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
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

  // Weight measurements (in tonnes)
  @ApiProperty({ description: 'Organic waste processed (tonnes)', example: 50.0 })
  @IsNumber()
  @Min(0)
  organicWaste: number;

  @ApiPropertyOptional({ description: 'Inorganic/recyclable waste (tonnes)', example: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  inorganicWaste?: number;

  @ApiPropertyOptional({ description: 'Raw meat waste (tonnes)', example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rawMeatWaste?: number;

  @ApiPropertyOptional({ description: 'Total waste if different from sum (tonnes)', example: 62.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalWaste?: number;

  // Compost & Recovery
  @ApiProperty({ description: 'Compost received/produced (tonnes)', example: 25.0 })
  @IsNumber()
  @Min(0)
  compostReceived: number;

  @ApiPropertyOptional({ description: 'Compost quality grade', example: 'Grade A' })
  @IsOptional()
  @IsString()
  compostQuality?: string;

  @ApiPropertyOptional({ description: 'Recovery ratio (%)', example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recoveryRatio?: number;

  // Environmental Impact
  @ApiPropertyOptional({ description: 'Methane recovered (m³ or kg)', example: 150.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  methaneRecovered?: number;

  @ApiPropertyOptional({ description: 'Methane emissions avoided (kg CH₄ eq)', example: 1200.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  methaneSaved?: number;

  @ApiPropertyOptional({ description: 'CO2 equivalent saved (tonnes)', example: 30.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  co2Equivalent?: number;

  // Processing Details
  @ApiPropertyOptional({ description: 'Amount diverted from landfill (tonnes)', example: 45.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  landfillDiverted?: number;

  @ApiPropertyOptional({ description: 'Recycling rate (%)', example: 75.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  recyclingRate?: number;

  @ApiPropertyOptional({ description: 'Primary disposal method', example: 'Composting' })
  @IsOptional()
  @IsString()
  disposalMethod?: string;

  // Monthly breakdown (optional)
  @ApiPropertyOptional({ 
    description: 'Monthly breakdown data as JSON',
    example: { jan: { organic: 4.2, inorganic: 0.8 }, feb: { organic: 4.5, inorganic: 0.9 } }
  })
  @IsOptional()
  monthlyData?: any;

  // Notes
  @ApiPropertyOptional({ description: 'Additional notes or comments', example: 'Increased composting efficiency' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Data source', example: 'Site Monthly Report' })
  @IsOptional()
  @IsString()
  dataSource?: string;
}
