import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateSpeciesDto {
  @ApiProperty({
    description: 'Unique species code (optional, can be auto-generated)',
    example: 'POPLAR',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Scientific name (primary identifier)',
    example: 'Populus nigra',
  })
  @IsString()
  @IsNotEmpty()
  scientificName: string;

  @ApiProperty({
    description: 'Botanical/scientific name (alias for scientificName, legacy)',
    example: 'Populus nigra',
    required: false,
  })
  @IsString()
  @IsOptional()
  botanicalName?: string;

  @ApiProperty({
    description: 'Local name',
    example: 'Siah poplar',
  })
  @IsString()
  @IsNotEmpty()
  localName: string;

  @ApiProperty({
    description: 'English name',
    example: 'Lombardy poplar',
  })
  @IsString()
  @IsNotEmpty()
  englishName: string;

  @ApiProperty({
    description: 'Description of the species',
    example: 'A tall deciduous tree...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Uses of the species',
    example: 'Timber, windbreaks, ornamental',
  })
  @IsString()
  @IsNotEmpty()
  uses: string;

  @ApiProperty({
    description: 'Legacy single image path',
    example: '/images/species/poplar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imagePath?: string;

  @ApiProperty({
    description: 'Image 1 URL (Habitat view)',
    example: 'https://example.com/habitat.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image1Url?: string;

  @ApiProperty({
    description: 'Image 2 URL (Leaf close-up)',
    example: 'https://example.com/leaf.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image2Url?: string;

  @ApiProperty({
    description: 'Image 3 URL (Bark texture)',
    example: 'https://example.com/bark.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image3Url?: string;

  @ApiProperty({
    description: 'Image 4 URL (Seed/flower)',
    example: 'https://example.com/flower.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  image4Url?: string;
}

export class UpdateSpeciesDto {
  @ApiProperty({
    description: 'Unique species code',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Scientific name',
    required: false,
  })
  @IsString()
  @IsOptional()
  scientificName?: string;

  @ApiProperty({
    description: 'Botanical name (alias for scientificName)',
    required: false,
  })
  @IsString()
  @IsOptional()
  botanicalName?: string;

  @ApiProperty({
    description: 'Local name',
    required: false,
  })
  @IsString()
  @IsOptional()
  localName?: string;

  @ApiProperty({
    description: 'English name',
    required: false,
  })
  @IsString()
  @IsOptional()
  englishName?: string;

  @ApiProperty({
    description: 'Description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Uses',
    required: false,
  })
  @IsString()
  @IsOptional()
  uses?: string;

  @ApiProperty({
    description: 'Legacy image path',
    required: false,
  })
  @IsString()
  @IsOptional()
  imagePath?: string;

  @ApiProperty({
    description: 'Image 1 URL (Habitat)',
    required: false,
  })
  @IsString()
  @IsOptional()
  image1Url?: string;

  @ApiProperty({
    description: 'Image 2 URL (Leaf)',
    required: false,
  })
  @IsString()
  @IsOptional()
  image2Url?: string;

  @ApiProperty({
    description: 'Image 3 URL (Bark)',
    required: false,
  })
  @IsString()
  @IsOptional()
  image3Url?: string;

  @ApiProperty({
    description: 'Image 4 URL (Seed/flower)',
    required: false,
  })
  @IsString()
  @IsOptional()
  image4Url?: string;
}
