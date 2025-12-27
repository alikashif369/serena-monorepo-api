import { IsInt, IsNumber, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSolarDataDto {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  siteId: number;

  @ApiProperty({ description: 'Year of installation', example: 2020 })
  @IsInt()
  @Min(2000)
  installationYear: number;

  @ApiProperty({ description: 'System capacity in kWh', example: 150.0 })
  @IsNumber()
  @Min(0)
  capacityKwh: number;

  @ApiProperty({
    description: 'Quarterly production data as JSON object',
    example: { 'Q1_2023': 1200, 'Q2_2023': 1500, 'Q3_2023': 1400, 'Q4_2023': 1100 }
  })
  @IsObject()
  quarterlyProduction: Record<string, number>;
}
