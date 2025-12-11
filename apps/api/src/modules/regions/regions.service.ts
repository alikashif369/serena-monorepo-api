import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(
    private prisma: PrismaService,
    private hierarchyService: HierarchyService,
  ) {}

  async create(createRegionDto: CreateRegionDto) {
    // Validate organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: createRegionDto.organizationId },
    });
    if (!organization) {
      throw new BadRequestException(
        `Organization with ID ${createRegionDto.organizationId} not found`,
      );
    }

    try {
      const result = await this.prisma.region.create({
        data: {
          name: createRegionDto.name,
          slug: createRegionDto.slug,
          organizationId: createRegionDto.organizationId,
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
      this.hierarchyService.invalidateCache();
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Region with this slug already exists in this organization',
          );
        }
      }
      throw error;
    }
  }

  async findAll(organizationId?: number) {
    const where: any = { deletedAt: null };
    if (organizationId) where.organizationId = organizationId;
    
    return this.prisma.region.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            categories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        categories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            _count: {
              select: {
                sites: true,
                subCategories: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!region || region.deletedAt !== null) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    return region;
  }

  async update(id: number, updateRegionDto: UpdateRegionDto) {
    // Check if region exists and is not deleted
    const region = await this.prisma.region.findUnique({ where: { id } });

    if (!region || region.deletedAt !== null) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    // Validate organization if being updated
    if (updateRegionDto.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: updateRegionDto.organizationId },
      });
      if (!organization) {
        throw new BadRequestException(
          `Organization with ID ${updateRegionDto.organizationId} not found`,
        );
      }
    }

    try {
      return await this.prisma.region.update({
        where: { id },
        data: {
          ...(updateRegionDto.name && { name: updateRegionDto.name }),
          ...(updateRegionDto.slug && { slug: updateRegionDto.slug }),
          ...(updateRegionDto.organizationId && {
            organizationId: updateRegionDto.organizationId,
          }),
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Region with this slug already exists in this organization',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    const region = await this.prisma.region.findUnique({ where: { id } });

    if (!region || region.deletedAt !== null) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    // Soft delete
    return await this.prisma.region.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async getCategories(regionId: number) {
    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
    });

    if (!region || region.deletedAt !== null) {
      throw new NotFoundException(`Region with ID ${regionId} not found`);
    }

    return this.prisma.category.findMany({
      where: { regionId, deletedAt: null },
      include: {
        _count: {
          select: {
            sites: true,
            subCategories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
