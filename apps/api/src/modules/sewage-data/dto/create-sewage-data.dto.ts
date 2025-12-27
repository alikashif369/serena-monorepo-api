import { IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSewageDataDto {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  siteId: number;

  @ApiProperty({ description: 'Year of the data', example: 2023 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'Recovery ratio (0-100%)', example: 85.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  recoveryRatio: number;

  @ApiProperty({ description: 'Methane saved (m³)', example: 500.0 })
  @IsNumber()
  @Min(0)
  methaneSaved: number;
}
