import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';

export class UploadRasterDto {
  @ApiProperty({
    description: 'Site ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({
    description: 'Year of the raster',
    example: 2024,
  })
  @IsNumber()
  @IsNotEmpty()
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
