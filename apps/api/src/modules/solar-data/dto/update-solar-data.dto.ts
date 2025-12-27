import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSolarDataDto } from './create-solar-data.dto';

export class UpdateSolarDataDto extends PartialType(
  OmitType(CreateSolarDataDto, ['siteId'] as const),
) {}
