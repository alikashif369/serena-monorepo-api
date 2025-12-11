import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
