import { IsInt, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommunityDataDto {
  @ApiProperty({ description: 'Site ID', example: 1 })
  @IsInt()
  siteId: number;

  @ApiProperty({ description: 'The year of reporting', example: 2024 })
  @IsInt()
  @Min(2019)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Dynamic JSON data for community initiatives',
    example: { 'Clean Stoves': 50, 'Seeds': 200, 'School Kits': 100 },
    type: 'object',
    additionalProperties: true
  })
  @IsObject()
  data: Record<string, any>;
}
