import { Controller, Get } from '@nestjs/common';
import { RasterServiceService } from './raster-service.service';

@Controller()
export class RasterServiceController {
  constructor(private readonly rasterServiceService: RasterServiceService) {}

  @Get()
  getHello(): string {
    return this.rasterServiceService.getHello();
  }
}
