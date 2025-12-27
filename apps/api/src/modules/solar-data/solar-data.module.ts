import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SolarDataController } from './solar-data.controller';
import { SolarDataService } from './solar-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [SolarDataController],
  providers: [SolarDataService],
  exports: [SolarDataService],
})
export class SolarDataModule {}
