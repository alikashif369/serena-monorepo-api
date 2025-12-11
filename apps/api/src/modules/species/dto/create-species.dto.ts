import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSpeciesDto {
  @ApiProperty({
    description: 'Unique species code',
    example: 'ACE001',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Botanical/scientific name',
    example: 'Acacia nilotica',
  })
  @IsString()
  @IsNotEmpty()
  botanicalName: string;

  @ApiProperty({
    description: 'Local name',
    example: 'Kikar',
    required: false,
  })
  @IsString()
  @IsOptional()
  localName?: string;

  @ApiProperty({
    description: 'English name',
    example: 'Gum Arabic Tree',
    required: false,
  })
  @IsString()
  @IsOptional()
  englishName?: string;

  @ApiProperty({
    description: 'Description',
    example: 'A thorny shrub or tree',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Uses',
    example: 'Timber, firewood, gum arabic',
    required: false,
  })
  @IsString()
  @IsOptional()
  uses?: string;

  @ApiProperty({
    description: 'Image path',
    example: '/images/species/kikar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imagePath?: string;
}

export class UpdateSpeciesDto {
  @ApiProperty({
    description: 'Botanical name',
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
    description: 'Image path',
    required: false,
  })
  @IsString()
  @IsOptional()
  imagePath?: string;
}
