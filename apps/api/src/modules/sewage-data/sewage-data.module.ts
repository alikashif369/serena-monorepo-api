import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SewageDataController } from './sewage-data.controller';
import { SewageDataService } from './sewage-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [SewageDataController],
  providers: [SewageDataService],
  exports: [SewageDataService],
})
export class SewageDataModule {}
