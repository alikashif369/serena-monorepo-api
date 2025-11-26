import { Injectable, BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@authModules/prisma/prisma.service';
import { UserService } from '@authModules/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SaveDeviceInfoDto } from '@authModules/user/dto/save-device-info.dto';
import { LogoutDto } from '@authModules/user/dto/logout.dto';
import { checkPassword } from '@shared-config/helpers';

@Injectable()
export class AuthenticationService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const emailFound = await this.userService.findByEmail(registerDto.email);

    if (emailFound) {
      throw new BadRequestException('Email already exists');
    }

    // Prevent non-admin users from registering as admin
    if (registerDto.role && ['SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(registerDto.role)) {
      throw new BadRequestException('Unauthorized role assignment');
    }

    const user = await this.userService.register(registerDto);

    // Send verification email
    await this.userService.sendOtpToEmail(user.email);

    return {
      userDto: { ...user },
      message: 'Registration successful. Please check your email for verification code.',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.userService.verifyEmail(verifyEmailDto);

    return {
      userDto: user.safeUser,
      accessToken: this.getAccessToken(user.safeUser, false),
    };
  }

  async login(loginDto: LoginDto, req: any) {
    try {
      const ipAddress = req.ip;
      const deviceInfo = req.headers['user-agent'];

      const user = await this.validateUser(loginDto);

      if (!user) {
        throw new BadRequestException('Invalid credentials');
      }

      if (!user.emailVerified) {
        await this.userService.sendOtpToEmail(user.email);
        throw new BadRequestException(
          'Email not verified. A new verification code has been sent to your email.',
        );
      }

      if (user.status === 'Inactive') {
        throw new HttpException(
          'Your account has been blocked, please contact the admin',
          HttpStatus.FORBIDDEN,
        );
      }

      const saveDeviceInfoDto: SaveDeviceInfoDto = {
        userId: user.id,
        ipAddress: ipAddress,
        deviceInfo: deviceInfo,
      };

      await this.userService.saveDeviceInfo(saveDeviceInfoDto);

      const accessToken = this.getAccessToken(user, loginDto.rememberMe);

      return {
        accessToken: accessToken,
        userDto: { ...user },
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(logoutDto: LogoutDto, userId: number) {
    const device = await this.prisma.deviceInfo.findFirst({
      where: {
        userId,
        ipAddress: logoutDto.ipAddress,
        deviceInfo: logoutDto.deviceInfo,
      },
    });

    if (device) {
      await this.prisma.deviceInfo.update({
        where: { id: device.id },
        data: { status: 'Inactive' },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async validateUser(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await checkPassword(loginDto.password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  getAccessToken(user: any, rememberMe: boolean = false) {
    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    // Use the default expiry from module config (7d) or override for remember me
    if (rememberMe) {
      return this.jwtService.sign(payload, { expiresIn: '30d' });
    }
    
    return this.jwtService.sign(payload);
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = Math.random().toString(36).substring(2, 15);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.prisma.resetToken.create({
      data: {
        userId: user.id,
        token,
        expiry,
      },
    });

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset URL: http://localhost:3000/reset-password/${user.id}/${token}`);

    return { message: 'Password reset link sent to email' };
  }

  async findResetPasswordToken(userId: number, token: string) {
    const resetToken = await this.prisma.resetToken.findFirst({
      where: {
        userId,
        token,
        isUsed: false,
        expiry: { gte: new Date() },
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return { valid: true };
  }
}
