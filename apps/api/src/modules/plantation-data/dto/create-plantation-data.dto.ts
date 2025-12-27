import { IsInt, IsArray, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlantationDataDto {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  siteId: number;

  @ApiProperty({ description: 'Total number of plants', example: 5000 })
  @IsInt()
  @Min(0)
  plants: number;

  @ApiProperty({
    description: 'Array of species codes planted at this site',
    example: ['PINWAL', 'CEDDAR', 'JUNSQ'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  species: string[];
}
