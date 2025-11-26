import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthenticationModule } from '@authModules/authentication/authentication.module';
import { PrismaModule } from '@authModules/prisma/prisma.module';
import { UserModule } from '@authModules/user/user.module';
import { SeedsModule } from '@authModules/seed/seed.module';

@Module({
  imports: [
    CommandModule,
    AuthenticationModule,
    PrismaModule,
    UserModule,
    SeedsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
