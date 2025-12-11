import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';

@Module({
  imports: [PrismaModule],
  controllers: [HierarchyController],
  providers: [HierarchyService],
  exports: [HierarchyService],
})
export class HierarchyModule {}
