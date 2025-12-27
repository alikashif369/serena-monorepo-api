import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateWasteDataDto } from './create-waste-data.dto';

export class UpdateWasteDataDto extends PartialType(
  OmitType(CreateWasteDataDto, ['siteId', 'year'] as const),
) {}
