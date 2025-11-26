import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VectorServiceModule } from './vector-service.module';
import { vectorServicePort, corsOrigin } from '@shared-config/env';

async function bootstrap() {
  const app = await NestFactory.create(VectorServiceModule);
  
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
    .setTitle('Vector Service • Serena GIS API')
    .setDescription('Vector data management service with PostGIS support for geospatial operations')
    .setVersion('1.0')
    .addTag('vector-layers', 'Vector layer CRUD operations')
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
    customSiteTitle: 'Vector Service API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = vectorServicePort;
  await app.listen(port);
  console.log(`🚀 Vector Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api`);
}
bootstrap();