import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WasteDataController } from './waste-data.controller';
import { WasteDataService } from './waste-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [WasteDataController],
  providers: [WasteDataService],
  exports: [WasteDataService],
})
export class WasteDataModule {}
