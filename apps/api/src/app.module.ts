import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RegionsModule } from './modules/regions/regions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SubCategoriesModule } from './modules/sub-categories/sub-categories.module';
import { SitesModule } from './modules/sites/sites.module';
import { YearlyMetricsModule } from './modules/yearly-metrics/yearly-metrics.module';
import { RastersModule } from './modules/rasters/rasters.module';
import { VectorsModule } from './modules/vectors/vectors.module';
import { HierarchyModule } from './modules/hierarchy/hierarchy.module';
import { SpeciesModule } from './modules/species/species.module';
import { PhotosModule } from './modules/photos/photos.module';
import { AggregateMetricsModule } from './modules/aggregate-metrics/aggregate-metrics.module';
import { CategorySummariesModule } from './modules/category-summaries/category-summaries.module';
import { PlantationDataModule } from './modules/plantation-data/plantation-data.module';
import { SolarDataModule } from './modules/solar-data/solar-data.module';
import { WasteDataModule } from './modules/waste-data/waste-data.module';
import { SewageDataModule } from './modules/sewage-data/sewage-data.module';
import { SiteSpeciesModule } from './modules/site-species/site-species.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Global rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RegionsModule,
    CategoriesModule,
    SubCategoriesModule,
    SitesModule,
    YearlyMetricsModule,
    RastersModule,
    VectorsModule,
    HierarchyModule,
    SpeciesModule,
    PhotosModule,
    AggregateMetricsModule,
    CategorySummariesModule,
    PlantationDataModule,
    SolarDataModule,
    WasteDataModule,
    SewageDataModule,
    SiteSpeciesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enable global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
