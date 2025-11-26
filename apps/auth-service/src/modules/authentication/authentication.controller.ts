import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LogoutDto } from '@authModules/user/dto/logout.dto';
import { JwtAuthGuard } from '@shared-config/authentication/guards/jwt-auth.guard';
import { LocalAuthGuard } from '@shared-config/authentication/guards/local-auth.guard';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    if (registerDto.role && ['SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(registerDto.role)) {
      return new BadRequestException('Unauthorized role assignment');
    }
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(@Request() req: any, @Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto, req);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any, @Body() logoutDto: LogoutDto) {
    const userId = req.user.id;
    await this.authService.logout(logoutDto, userId);
    return { message: 'Logout successful' };
  }

  @Get('forgot-password/:email')
  forgotPassword(@Param('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Get('reset-password-token/:userId/:token')
  findResetPasswordToken(
    @Param('userId') userId: number,
    @Param('token') token: string,
  ) {
    return this.authService.findResetPasswordToken(userId, token);
  }
}
