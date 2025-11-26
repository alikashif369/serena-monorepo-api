import { Module } from '@nestjs/common';
import { PrismaModule } from '@authModules/prisma/prisma.module';
import { UserModule } from '@authModules/user/user.module';
import { AdminSeed } from './admin.seed';
import { CommandModule } from 'nestjs-command';

@Module({
  imports: [CommandModule, UserModule, PrismaModule],
  providers: [AdminSeed],
  exports: [SeedsModule],
})
export class SeedsModule {}
