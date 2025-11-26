import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVectorLayerDto {
  @ApiProperty({ 
    description: 'Name of the vector layer',
    example: 'Farm Boundary' 
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: 'Description of the vector layer',
    example: 'Main farm boundary polygon' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'GeoJSON geometry object (Point, Polygon, MultiPolygon, etc.)',
    example: {
      type: 'Polygon',
      coordinates: [[
        [100.0, 0.0],
        [101.0, 0.0],
        [101.0, 1.0],
        [100.0, 1.0],
        [100.0, 0.0]
      ]]
    }
  })
  @IsNotEmpty()
  @IsObject()
  geometry: any;

  @ApiPropertyOptional({ 
    description: 'Additional properties/attributes for the layer',
    example: {
      siteName: 'North Field',
      classification: 'Agricultural',
      year: 2024
    }
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'User ID (will be populated from JWT token)',
    example: 'user-123' 
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

