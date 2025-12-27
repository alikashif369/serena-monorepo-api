import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSewageDataDto } from './create-sewage-data.dto';

export class UpdateSewageDataDto extends PartialType(
  OmitType(CreateSewageDataDto, ['siteId', 'year'] as const),
) {}
