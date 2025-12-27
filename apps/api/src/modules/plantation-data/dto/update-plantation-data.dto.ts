import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePlantationDataDto } from './create-plantation-data.dto';

export class UpdatePlantationDataDto extends PartialType(
  OmitType(CreatePlantationDataDto, ['siteId'] as const),
) {}
