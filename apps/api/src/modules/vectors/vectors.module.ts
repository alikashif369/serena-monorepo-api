import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VectorsController } from './vectors.controller';
import { VectorsService } from './vectors.service';

@Module({
  imports: [PrismaModule],
  controllers: [VectorsController],
  providers: [VectorsService],
  exports: [VectorsService],
})
export class VectorsModule {}
