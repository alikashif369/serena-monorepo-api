import { Module } from '@nestjs/common';
import { SiteSpeciesController, SpeciesSitesController } from './site-species.controller';
import { SiteSpeciesService } from './site-species.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SiteSpeciesController, SpeciesSitesController],
  providers: [SiteSpeciesService],
  exports: [SiteSpeciesService],
})
export class SiteSpeciesModule {}
