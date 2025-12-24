import { Module } from '@nestjs/common';
import { AggregateMetricsService } from './aggregate-metrics.service';
import { AggregateMetricsController } from './aggregate-metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AggregateMetricsController],
  providers: [AggregateMetricsService],
  exports: [AggregateMetricsService]
})
export class AggregateMetricsModule {}
