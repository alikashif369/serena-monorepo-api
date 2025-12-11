import { PartialType, OmitType } from '@nestjs/swagger';
import { UploadPhotoDto } from './upload-photo.dto';

export class UpdatePhotoDto extends PartialType(
  OmitType(UploadPhotoDto, ['file', 'category'] as const)
) {}
