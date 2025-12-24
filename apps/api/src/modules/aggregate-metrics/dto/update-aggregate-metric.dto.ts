import { PartialType } from '@nestjs/swagger';
import { CreateAggregateMetricDto } from './create-aggregate-metric.dto';

export class UpdateAggregateMetricDto extends PartialType(CreateAggregateMetricDto) {}
