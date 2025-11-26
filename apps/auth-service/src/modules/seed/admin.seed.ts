import { PrismaService } from '@authModules/prisma/prisma.service';
import { UserService } from '@authModules/user/user.service';
import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@notiz/auth';
import { Command } from 'nestjs-command';

@Injectable()
export class AdminSeed {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  @Command({
    command: 'seed:admin',
    describe: 'Seed admin user for SerenaGreen',
  })
  async create() {
    try {
      const existingAdmin = await this.prisma.user.findFirst({
        where: {
          email: 'admin@serenagreen.com',
        },
      });

      if (existingAdmin) {
        console.log('✅ Admin already exists, skipping...');
        return;
      }

      await this.userService.createAdmin({
        name: 'SerenaGreen Admin',
        email: 'admin@serenagreen.com',
        password: 'serena@123',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.Active,
        emailVerified: true,
      });

      console.log('✅ Admin user created successfully.');
      console.log('📧 Email: admin@serenagreen.com');
      console.log('🔑 Password: serena@123');
      console.log('⚠️  Please change the password after first login!');
    } catch (error) {
      console.error('❌ Error seeding admin:', error);
    }
  }
}
