import { NestFactory } from '@nestjs/core';
import { RasterServiceModule } from './raster-service.module';

async function bootstrap() {
  const app = await NestFactory.create(RasterServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
