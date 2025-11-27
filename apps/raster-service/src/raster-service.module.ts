import { Module } from '@nestjs/common';
import { RasterServiceController } from './raster-service.controller';
import { RasterServiceService } from './raster-service.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { MinioService } from './common/services/minio.service';

@Module({
  imports: [PrismaModule, AuthenticationModule],
  controllers: [RasterServiceController],
  providers: [RasterServiceService, MinioService],
})
export class RasterServiceModule {}
