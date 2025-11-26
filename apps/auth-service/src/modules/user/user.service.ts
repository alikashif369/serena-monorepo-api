import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@authModules/prisma/prisma.service';
import { RegisterDto } from '@authModules/authentication/dto/register.dto';
import { SaveDeviceInfoDto } from './dto/save-device-info.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { encryptPassword } from '@shared-config/helpers';
import { UserRole, UserStatus } from '@notiz/auth';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await encryptPassword(registerDto.password);
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        phone: registerDto.phone,
        password: hashedPassword,
        role: (registerDto.role as UserRole) || UserRole.VIEWER,
        emailVerificationCode: verificationCode,
        emailVerified: false, // Will be set to true after email verification
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async createAdmin(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
  }) {
    const hashedPassword = await encryptPassword(data.password);
    
    return await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(id: number, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateDto,
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async deleteUser(id: number) {
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'User deleted successfully' };
  }

  async verifyEmail(verifyEmailDto: { email: string; verificationCode: number }) {
    const user = await this.findByEmail(verifyEmailDto.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (user.emailVerificationCode !== verifyEmailDto.verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

    const updatedUser = await this.prisma.user.update({
      where: { email: verifyEmailDto.email },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
      },
    });

    const { password, ...safeUser } = updatedUser;
    return { safeUser };
  }

  async sendOtpToEmail(email: string) {
    // Generate new OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    await this.prisma.user.update({
      where: { email },
      data: { emailVerificationCode: verificationCode },
    });

    // TODO: Send email via SendGrid
    console.log(`Verification code for ${email}: ${verificationCode}`);
    console.log('Note: SendGrid integration pending - add SENDGRID_API_KEY to .env');

    return { message: 'Verification code sent to email' };
  }

  async saveDeviceInfo(saveDeviceInfoDto: SaveDeviceInfoDto) {
    const existingDevice = await this.prisma.deviceInfo.findFirst({
      where: {
        userId: saveDeviceInfoDto.userId,
        ipAddress: saveDeviceInfoDto.ipAddress,
        deviceInfo: saveDeviceInfoDto.deviceInfo,
      },
    });

    if (existingDevice) {
      return await this.prisma.deviceInfo.update({
        where: { id: existingDevice.id },
        data: { counter: existingDevice.counter + 1 },
      });
    }

    return await this.prisma.deviceInfo.create({
      data: saveDeviceInfoDto,
    });
  }

  async listUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          assignedSites: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
