import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsNotEmpty, Min, Max } from 'class-validator';

export class UploadRasterDto {
  @ApiProperty({
    description: 'Site ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({
    description: 'Year of the raster (2000-2100)',
    example: 2024,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(2000, { message: 'Year must be at least 2000' })
  @Max(2100, { message: 'Year cannot exceed 2100' })
  year: number;

  @ApiProperty({
    description: 'Whether this is a classified raster',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isClassified: boolean;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'GeoTIFF file',
  })
  file: any;
}
