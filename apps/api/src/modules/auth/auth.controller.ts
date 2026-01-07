import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { InvitationService } from '../invitation/invitation.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@shared-config/authentication';
import { InviteAdminDto, AcceptInvitationDto } from '../invitation/dto';
import { LoginDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
  ) {}

  // ============================================================================
  // Public Endpoints
  // ============================================================================

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute - brute force protection
  @ApiOperation({ summary: 'Admin login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Only allow SUPER_ADMIN and ADMIN roles to login
    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException('You do not have admin access');
    }

    return this.authService.login(user);
  }

  @Get('verify-invitation/:token')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({ summary: 'Verify an invitation token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 400, description: 'Token is invalid or expired' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async verifyInvitation(@Param('token') token: string) {
    return this.invitationService.verifyToken(token);
  }

  @Post('accept-invitation')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute - prevent token brute force
  @ApiOperation({ summary: 'Accept invitation and create account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited' })
  async acceptInvitation(@Body() acceptDto: AcceptInvitationDto) {
    return this.invitationService.acceptInvitation(acceptDto);
  }

  // ============================================================================
  // Protected Endpoints - Require Authentication
  // ============================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user info' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req) {
    // For JWT, logout is handled client-side by removing the token
    // This endpoint can be used to log the logout event or invalidate tokens if needed
    return { message: 'Logout successful' };
  }

  // ============================================================================
  // SUPER_ADMIN Only Endpoints
  // ============================================================================

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new admin (SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 403, description: 'Only SUPER_ADMIN can invite' })
  @ApiResponse({ status: 409, description: 'Email already exists or invitation pending' })
  async inviteAdmin(@Request() req, @Body() inviteDto: InviteAdminDto) {
    return this.invitationService.createInvitation(inviteDto, req.user.userId);
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all invitations (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Returns list of invitations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listInvitations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.invitationService.listInvitations(Number(page), Number(limit));
  }

  @Delete('invitations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a pending invitation (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async revokeInvitation(@Param('id', ParseIntPipe) id: number) {
    return this.invitationService.revokeInvitation(id);
  }

  @Post('invitations/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend invitation email (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Invitation resent' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async resendInvitation(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.invitationService.resendInvitation(id, req.user.userId);
  }

  // ============================================================================
  // User Management (SUPER_ADMIN Only)
  // ============================================================================

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all admin users (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.authService.listUsers(Number(page), Number(limit));
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an admin user (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete yourself or SUPER_ADMIN' })
  async deleteUser(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.authService.deleteUser(id, req.user.userId);
  }
}
