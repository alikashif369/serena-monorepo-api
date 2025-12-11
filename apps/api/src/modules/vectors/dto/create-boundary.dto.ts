import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateBoundaryDto {
  @ApiProperty({
    description: 'Site ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  siteId: number;

  @ApiProperty({
    description: 'Year of the boundary',
    example: 2024,
  })
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    description: 'GeoJSON geometry object',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [73.5, 33.5],
          [73.6, 33.5],
          [73.6, 33.6],
          [73.5, 33.6],
          [73.5, 33.5],
        ],
      ],
    },
  })
  @IsObject()
  @IsNotEmpty()
  geometry: any;

  @ApiProperty({
    description: 'Optional GeoJSON properties',
    example: { name: 'Test Boundary' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  properties?: any;
}

export class UpdateBoundaryDto {
  @ApiProperty({
    description: 'GeoJSON geometry object',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [73.5, 33.5],
          [73.6, 33.5],
          [73.6, 33.6],
          [73.5, 33.6],
          [73.5, 33.5],
        ],
      ],
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  geometry?: any;

  @ApiProperty({
    description: 'Optional GeoJSON properties',
    example: { name: 'Updated Boundary' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  properties?: any;
}
