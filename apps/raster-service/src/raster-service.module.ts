import { Module } from '@nestjs/common';
import { RasterServiceController } from './raster-service.controller';
import { RasterServiceService } from './raster-service.service';

@Module({
  imports: [],
  controllers: [RasterServiceController],
  providers: [RasterServiceService],
})
export class RasterServiceModule {}
