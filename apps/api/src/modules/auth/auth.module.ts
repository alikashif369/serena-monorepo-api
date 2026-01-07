import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '@shared-config/authentication/strategy/jwt.strategy';
import { LocalStrategy } from '@shared-config/authentication/strategy/local.strategy';
import { RolesGuard } from '@shared-config/authentication';
import { PrismaModule } from '../prisma/prisma.module';
import { InvitationModule } from '../invitation/invitation.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    InvitationModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
