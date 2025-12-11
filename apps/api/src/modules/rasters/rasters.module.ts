import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioService } from '../../common/services/minio.service';
import { RastersController } from './rasters.controller';
import { RastersService } from './rasters.service';

@Module({
  imports: [PrismaModule],
  controllers: [RastersController],
  providers: [RastersService, MinioService],
  exports: [RastersService],
})
export class RastersModule {}
