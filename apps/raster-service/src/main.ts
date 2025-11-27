import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RasterServiceModule } from './raster-service.module';
import { rasterServicePort, corsOrigin } from '@shared-config/env';

async function bootstrap() {
  const app = await NestFactory.create(RasterServiceModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Raster Service • Serena GIS API')
    .setDescription('Raster data management service for COG uploads and tile serving via TiTiler')
    .setVersion('1.0')
    .addTag('rasters', 'Raster CRUD and tile operations')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Raster Service API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = rasterServicePort;
  await app.listen(port);
  console.log(`🚀 Raster Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api`);
}
bootstrap();
