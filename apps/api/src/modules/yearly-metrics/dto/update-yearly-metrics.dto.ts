import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateYearlyMetricsDto } from './create-yearly-metrics.dto';

// Cannot change siteId or year after creation (they form the unique key)
export class UpdateYearlyMetricsDto extends PartialType(
  OmitType(CreateYearlyMetricsDto, ['siteId', 'year'] as const),
) {}
