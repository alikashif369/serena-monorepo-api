import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpeciesController } from './species.controller';
import { SpeciesService } from './species.service';
import { MinioService } from '../../common/services/minio.service';

@Module({
  imports: [PrismaModule],
  controllers: [SpeciesController],
  providers: [SpeciesService, MinioService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
