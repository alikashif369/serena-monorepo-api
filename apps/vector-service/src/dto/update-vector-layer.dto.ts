import { PartialType } from '@nestjs/mapped-types';
import { CreateVectorLayerDto } from './create-vector-layer.dto';

export class UpdateVectorLayerDto extends PartialType(CreateVectorLayerDto) {}