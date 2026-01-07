import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/roles.guard';

/**
 * Decorator to specify which roles are allowed to access a route
 * Usage: @Roles('SUPER_ADMIN') or @Roles('SUPER_ADMIN', 'ADMIN')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
