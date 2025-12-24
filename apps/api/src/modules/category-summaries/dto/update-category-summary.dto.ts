import { PartialType } from '@nestjs/swagger';
import { CreateCategorySummaryDto } from './create-category-summary.dto';

export class UpdateCategorySummaryDto extends PartialType(CreateCategorySummaryDto) {}
