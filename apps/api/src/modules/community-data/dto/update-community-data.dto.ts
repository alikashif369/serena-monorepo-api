import { PartialType } from '@nestjs/swagger';
import { CreateCommunityDataDto } from './create-community-data.dto';

export class UpdateCommunityDataDto extends PartialType(CreateCommunityDataDto) {}
