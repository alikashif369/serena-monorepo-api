import { Module } from '@nestjs/common';
import { CategorySummariesService } from './category-summaries.service';
import { CategorySummariesController } from './category-summaries.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategorySummariesController],
  providers: [CategorySummariesService],
  exports: [CategorySummariesService]
})
export class CategorySummariesModule {}
