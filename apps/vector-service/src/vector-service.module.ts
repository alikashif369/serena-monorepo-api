import { Module } from '@nestjs/common';
import { VectorServiceController } from './vector-service.controller';
import { VectorServiceService } from './vector-service.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';

@Module({
  imports: [
    PrismaModule,
    AuthenticationModule,
  ],
  controllers: [VectorServiceController],
  providers: [VectorServiceService],
})
export class VectorServiceModule {}