import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { MinioService } from '../../common/services/minio.service';

@Module({
  imports: [PrismaModule],
  controllers: [PhotosController],
  providers: [PhotosService, MinioService],
  exports: [PhotosService],
})
export class PhotosModule {}
