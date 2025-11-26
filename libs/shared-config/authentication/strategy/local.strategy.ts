import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    // This is a placeholder. In real implementation, validate against database
    // Should be implemented in the auth service that uses this strategy
    throw new UnauthorizedException('Local strategy must be implemented in auth service');
  }
}
