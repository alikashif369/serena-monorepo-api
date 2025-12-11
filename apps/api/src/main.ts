import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for API versioning
  app.setGlobalPrefix('api/v1');

  // Global validation pipe - updated to allow unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Allow unknown properties (only validate known ones)
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('SerenaGreen API')
    .setDescription(
      'Unified API for site management, rasters, and vectors. Migrated from 3-database microservices to single-database monolith.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    .addSecurityRequirements('jwt')
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Organizations', 'Organization hierarchy endpoints')
    .addTag('Sites', 'Site management and data endpoints')
    .addTag('Rasters', 'Raster upload and retrieval endpoints')
    .addTag('Vectors', 'Vector boundary endpoints')
    .addTag('Hierarchy', 'Site hierarchy and navigation endpoints')
    .addTag('Species', 'Species reference data endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`✓ SerenaGreen API running on http://localhost:${port}`);
  console.log(`✓ API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
