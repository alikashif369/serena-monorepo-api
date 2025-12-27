import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlantationDataController } from './plantation-data.controller';
import { PlantationDataService } from './plantation-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlantationDataController],
  providers: [PlantationDataService],
  exports: [PlantationDataService],
})
export class PlantationDataModule {}
