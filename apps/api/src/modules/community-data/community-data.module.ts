import { Module } from '@nestjs/common';
import { CommunityDataService } from './community-data.service';
import { CommunityDataController } from './community-data.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommunityDataController],
  providers: [CommunityDataService],
  exports: [CommunityDataService],
})
export class CommunityDataModule {}
