import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InviteAdminDto, AcceptInvitationDto } from './dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new invitation for an admin
   * Only SUPER_ADMIN can create invitations
   */
  async createInvitation(inviteDto: InviteAdminDto, inviterId: number) {
    const { email, role = 'ADMIN' } = inviteDto;

    // Check if email already exists as user
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check if invitation already exists and is not expired
    const existingInvite = await this.prisma.adminInvitation.findUnique({
      where: { email },
    });

    if (existingInvite) {
      if (!existingInvite.acceptedAt && existingInvite.expiresAt > new Date()) {
        throw new ConflictException('An active invitation already exists for this email');
      }
      // If expired or accepted, delete the old one
      await this.prisma.adminInvitation.delete({ where: { id: existingInvite.id } });
    }

    // Get inviter info
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { name: true },
    });

    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    // Create invitation
    const invitation = await this.prisma.adminInvitation.create({
      data: {
        email,
        token,
        role,
        invitedBy: inviterId,
        expiresAt,
      },
    });

    // Send email
    const emailResult = await this.emailService.sendInvitationEmail(
      email,
      token,
      inviter.name,
    );

    this.logger.log(`Invitation created for ${email} by user ${inviterId}`);

    return {
      message: emailResult.success
        ? 'Invitation sent successfully'
        : 'Invitation created but email may not have been sent',
      email,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Verify an invitation token
   */
  async verifyToken(token: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { token },
      select: {
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('This invitation has expired');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Accept an invitation and create the user account
   */
  async acceptInvitation(acceptDto: AcceptInvitationDto) {
    const { token, name, password } = acceptDto;

    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been used');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('This invitation has expired');
    }

    // Check if user was created by other means
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user and mark invitation as accepted in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role,
          status: 'ACTIVE',
          emailVerified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      // Mark invitation as accepted
      await tx.adminInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    this.logger.log(`User ${result.email} created via invitation`);

    return {
      message: 'Account created successfully',
      user: result,
    };
  }

  /**
   * List all invitations with pagination
   */
  async listInvitations(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [invitations, total] = await Promise.all([
      this.prisma.adminInvitation.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          inviter: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.adminInvitation.count(),
    ]);

    return {
      data: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.acceptedAt
          ? 'accepted'
          : new Date() > inv.expiresAt
            ? 'expired'
            : 'pending',
        invitedBy: inv.inviter,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Revoke a pending invitation
   */
  async revokeInvitation(id: number) {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Cannot revoke an accepted invitation');
    }

    await this.prisma.adminInvitation.delete({ where: { id } });

    this.logger.log(`Invitation ${id} revoked`);

    return { message: 'Invitation revoked successfully' };
  }

  /**
   * Resend an invitation email
   */
  async resendInvitation(id: number, inviterId: number) {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Cannot resend an accepted invitation');
    }

    // Get inviter info
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { name: true },
    });

    // Generate new token and extend expiry
    const newToken = randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.prisma.adminInvitation.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    });

    // Send email
    await this.emailService.sendInvitationEmail(
      invitation.email,
      newToken,
      inviter?.name || 'Admin',
    );

    return { message: 'Invitation resent successfully' };
  }
}
