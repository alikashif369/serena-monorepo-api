import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YearlyMetricsController } from './yearly-metrics.controller';
import { YearlyMetricsService } from './yearly-metrics.service';

@Module({
  imports: [PrismaModule],
  controllers: [YearlyMetricsController],
  providers: [YearlyMetricsService],
  exports: [YearlyMetricsService],
})
export class YearlyMetricsModule {}
