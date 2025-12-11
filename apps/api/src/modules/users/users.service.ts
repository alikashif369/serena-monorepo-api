import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(skip?: number, take = 50) {
    const users = await this.prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.user.count();

    return {
      data: users,
      meta: {
        total,
        skip: skip || 0,
        take,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        assignedSites: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async getSitesForUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.assignedSites || user.assignedSites.length === 0) {
      return [];
    }

    return this.prisma.site.findMany({
      where: {
        id: { in: user.assignedSites },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            region: {
              select: {
                id: true,
                name: true,
                slug: true,
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            yearlyMetrics: true,
            siteBoundaries: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
