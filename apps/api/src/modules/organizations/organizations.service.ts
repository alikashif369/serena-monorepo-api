import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private hierarchyService: HierarchyService,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    try {
      const result = await this.prisma.organization.create({
        data: {
          name: createOrganizationDto.name,
          slug: createOrganizationDto.slug,
          description: createOrganizationDto.description,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      this.hierarchyService.invalidateCache();
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Organization with this slug already exists',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            regions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        regions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                categories: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!organization || organization.deletedAt !== null) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    // Check if organization exists and is not deleted
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization || organization.deletedAt !== null) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    try {
      const result = await this.prisma.organization.update({
        where: { id },
        data: {
          ...(updateOrganizationDto.name && {
            name: updateOrganizationDto.name,
          }),
          ...(updateOrganizationDto.slug && {
            slug: updateOrganizationDto.slug,
          }),
          ...(updateOrganizationDto.description !== undefined && {
            description: updateOrganizationDto.description,
          }),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      this.hierarchyService.invalidateCache();
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Organization with this slug already exists',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization || organization.deletedAt !== null) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Soft delete
    const result = await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
      },
    });
    this.hierarchyService.invalidateCache();
    return result;
  }

  async getHierarchy(id: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        regions: {
          where: { deletedAt: null },
          include: {
            categories: {
              where: { deletedAt: null },
              include: {
                subCategories: {
                  where: { deletedAt: null },
                  include: {
                    sites: {
                      where: { deletedAt: null },
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        siteType: true,
                        district: true,
                        city: true,
                        area: true,
                        _count: {
                          select: {
                            yearlyMetrics: true,
                            siteBoundaries: true,
                          },
                        },
                      },
                      orderBy: { name: 'asc' },
                    },
                  },
                  orderBy: { name: 'asc' },
                },
                sites: {
                  where: { subCategoryId: null, deletedAt: null },
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    siteType: true,
                    district: true,
                    city: true,
                    area: true,
                    _count: {
                      select: {
                        yearlyMetrics: true,
                        siteBoundaries: true,
                      },
                    },
                  },
                  orderBy: { name: 'asc' },
                },
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!organization || organization.deletedAt !== null) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async getRegions(organizationId: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization || organization.deletedAt !== null) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    return this.prisma.region.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        _count: {
          select: {
            categories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
