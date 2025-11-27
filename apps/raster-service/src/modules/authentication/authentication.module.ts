import { Module } from '@nestjs/common';
import { JwtStrategy } from '@shared-config/authentication/strategy/jwt.strategy';

@Module({
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthenticationModule {}
