import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';

@Injectable()
export class SubCategoriesService {
  constructor(
    private prisma: PrismaService,
    private hierarchyService: HierarchyService,
  ) {}

  async create(createSubCategoryDto: CreateSubCategoryDto) {
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createSubCategoryDto.categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${createSubCategoryDto.categoryId} not found`,
      );
    }

    try {
      const result = await this.prisma.subCategory.create({
        data: {
          name: createSubCategoryDto.name,
          slug: createSubCategoryDto.slug,
          categoryId: createSubCategoryDto.categoryId,
        },
        include: {
          category: {
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
            'SubCategory with this slug already exists in this category',
          );
        }
      }
      throw error;
    }
  }

  async findAll(categoryId?: number) {
    const where: any = { deletedAt: null };
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.subCategory.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            region: {
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
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            region: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
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
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!subCategory || subCategory.deletedAt !== null) {
      throw new NotFoundException(`SubCategory with ID ${id} not found`);
    }

    return subCategory;
  }

  async update(id: number, updateSubCategoryDto: UpdateSubCategoryDto) {
    // Check if subcategory exists and is not deleted
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
    });

    if (!subCategory || subCategory.deletedAt !== null) {
      throw new NotFoundException(`SubCategory with ID ${id} not found`);
    }

    // Validate category if being updated
    if (updateSubCategoryDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateSubCategoryDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updateSubCategoryDto.categoryId} not found`,
        );
      }
    }

    try {
      const result = await this.prisma.subCategory.update({
        where: { id },
        data: {
          ...(updateSubCategoryDto.name && { name: updateSubCategoryDto.name }),
          ...(updateSubCategoryDto.slug && { slug: updateSubCategoryDto.slug }),
          ...(updateSubCategoryDto.categoryId && {
            categoryId: updateSubCategoryDto.categoryId,
          }),
        },
        include: {
          category: {
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
            'SubCategory with this slug already exists in this category',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
    });

    if (!subCategory || subCategory.deletedAt !== null) {
      throw new NotFoundException(`SubCategory with ID ${id} not found`);
    }

    // Soft delete
    const result = await this.prisma.subCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    this.hierarchyService.invalidateCache();
    return result;
  }
}
