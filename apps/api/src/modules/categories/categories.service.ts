import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private hierarchyService: HierarchyService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Validate region exists
    const region = await this.prisma.region.findUnique({
      where: { id: createCategoryDto.regionId },
    });
    if (!region) {
      throw new BadRequestException(
        `Region with ID ${createCategoryDto.regionId} not found`,
      );
    }

    try {
      const result = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          slug: createCategoryDto.slug,
          type: createCategoryDto.type,
          regionId: createCategoryDto.regionId,
        },
        include: {
          region: {
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
            'Category with this slug already exists in this region',
          );
        }
      }
      throw error;
    }
  }

  async findAll(regionId?: number, type?: string) {
    const where: any = { deletedAt: null };
    if (regionId) where.regionId = regionId;
    if (type) where.type = type;

    return this.prisma.category.findMany({
      where,
      include: {
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

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
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
        subCategories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                sites: true,
              },
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
            area: true,
            district: true,
            city: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category || category.deletedAt !== null) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists and is not deleted
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category || category.deletedAt !== null) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Validate region if being updated
    if (updateCategoryDto.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { id: updateCategoryDto.regionId },
      });
      if (!region) {
        throw new BadRequestException(
          `Region with ID ${updateCategoryDto.regionId} not found`,
        );
      }
    }

    try {
      const result = await this.prisma.category.update({
        where: { id },
        data: {
          ...(updateCategoryDto.name && { name: updateCategoryDto.name }),
          ...(updateCategoryDto.slug && { slug: updateCategoryDto.slug }),
          ...(updateCategoryDto.type && { type: updateCategoryDto.type }),
          ...(updateCategoryDto.regionId && {
            regionId: updateCategoryDto.regionId,
          }),
        },
        include: {
          region: {
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
            'Category with this slug already exists in this region',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category || category.deletedAt !== null) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Soft delete
    const result = await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        region: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    this.hierarchyService.invalidateCache();
    return result;
  }

  async getSites(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.deletedAt !== null) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.prisma.site.findMany({
      where: { categoryId, deletedAt: null },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
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

  async getHierarchy(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
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
        subCategories: {
          include: {
            sites: {
              select: {
                id: true,
                name: true,
                slug: true,
                siteType: true,
                area: true,
                district: true,
                city: true,
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
          where: { subCategoryId: null },
          select: {
            id: true,
            name: true,
            slug: true,
            siteType: true,
            area: true,
            district: true,
            city: true,
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
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return category;
  }
}
