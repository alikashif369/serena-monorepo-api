import { Test, TestingModule } from '@nestjs/testing';
import { RasterServiceController } from './raster-service.controller';
import { RasterServiceService } from './raster-service.service';

describe('RasterServiceController', () => {
  let rasterServiceController: RasterServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RasterServiceController],
      providers: [RasterServiceService],
    }).compile();

    rasterServiceController = app.get<RasterServiceController>(RasterServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(rasterServiceController.getHello()).toBe('Hello World!');
    });
  });
});
