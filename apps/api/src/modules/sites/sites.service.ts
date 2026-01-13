import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(
    private prisma: PrismaService,
    private hierarchyService: HierarchyService,
  ) {}

  async create(createSiteDto: CreateSiteDto) {
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createSiteDto.categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${createSiteDto.categoryId} not found`,
      );
    }

    // Validate subcategory exists if provided
    if (createSiteDto.subCategoryId) {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: createSiteDto.subCategoryId },
      });
      if (!subCategory) {
        throw new BadRequestException(
          `SubCategory with ID ${createSiteDto.subCategoryId} not found`,
        );
      }
    }

    try {
      const result = await this.prisma.site.create({
        data: {
          name: createSiteDto.name,
          slug: createSiteDto.slug,
          categoryId: createSiteDto.categoryId,
          subCategoryId: createSiteDto.subCategoryId,
          district: createSiteDto.district,
          city: createSiteDto.city,
          area: createSiteDto.area,
          coordinates: createSiteDto.coordinates as any,
          siteType: createSiteDto.siteType,
          infrastructure: createSiteDto.infrastructure,
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true, type: true },
          },
          subCategory: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
      this.hierarchyService.invalidateCache();
      return result;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Site with this slug already exists in this category',
        );
      }
      throw error;
    }
  }

  async findAll(query?: any) {
    const where: any = { deletedAt: null };

    if (query?.categoryId) where.categoryId = parseInt(query.categoryId);
    if (query?.subCategoryId) where.subCategoryId = parseInt(query.subCategoryId);
    if (query?.siteType) where.siteType = query.siteType;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { district: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.site.findMany({
      where,
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

  async findOne(id: number, includeMetrics = false) {
    const site = await this.prisma.site.findUnique({
      where: { id },
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
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        yearlyMetrics: includeMetrics ? true : false,
        plantationData: true,
        solarData: true,
        wasteData: true,
        sewageData: true,
        communityData: true,
        _count: {
          select: {
            siteBoundaries: true,
          },
        },
      },
    });

    if (!site || site.deletedAt !== null) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return site;
  }

  async update(id: number, updateSiteDto: UpdateSiteDto) {
    // Check if site exists and is not deleted
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site || site.deletedAt !== null) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    // Validate category if being updated
    if (updateSiteDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateSiteDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updateSiteDto.categoryId} not found`,
        );
      }
    }

    // Validate subcategory if being updated
    if (updateSiteDto.subCategoryId) {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: updateSiteDto.subCategoryId },
      });
      if (!subCategory) {
        throw new BadRequestException(
          `SubCategory with ID ${updateSiteDto.subCategoryId} not found`,
        );
      }
    }

    try {
      const updateData: any = {};
      if (updateSiteDto.name) updateData.name = updateSiteDto.name;
      if (updateSiteDto.slug) updateData.slug = updateSiteDto.slug;
      if (updateSiteDto.categoryId) updateData.categoryId = updateSiteDto.categoryId;
      if (updateSiteDto.subCategoryId !== undefined) updateData.subCategoryId = updateSiteDto.subCategoryId;
      if (updateSiteDto.district !== undefined) updateData.district = updateSiteDto.district;
      if (updateSiteDto.city !== undefined) updateData.city = updateSiteDto.city;
      if (updateSiteDto.area !== undefined) updateData.area = updateSiteDto.area;
      if (updateSiteDto.coordinates) updateData.coordinates = updateSiteDto.coordinates;
      if (updateSiteDto.siteType) updateData.siteType = updateSiteDto.siteType;
      if (updateSiteDto.infrastructure !== undefined) updateData.infrastructure = updateSiteDto.infrastructure;

      return await this.prisma.site.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: { id: true, name: true, slug: true, type: true },
          },
          subCategory: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Site with this slug already exists in this category',
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site || site.deletedAt !== null) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    console.log(`[SITE_DELETE] Starting deletion process for site ${id} (${site.name})`);

    // Use a transaction to ensure all deletions happen atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete associated data first (cascade delete)
      // Order matters due to foreign key constraints

      // 1. Delete yearly metrics (has FK to rasters)
      const deletedMetrics = await tx.yearlyMetrics.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedMetrics.count} yearly metrics for site ${id}`);

      // 2. Delete rasters
      const deletedRasters = await tx.raster.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedRasters.count} rasters for site ${id}`);

      // 3. Delete site boundaries (HARD DELETE)
      const deletedBoundaries = await tx.siteBoundary.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedBoundaries.count} boundaries for site ${id}`);

      // 4. Delete photos (set siteId to null instead of deleting)
      const updatedPhotos = await tx.photo.updateMany({
        where: { siteId: id },
        data: { siteId: null },
      });
      console.log(`[SITE_DELETE] Unlinked ${updatedPhotos.count} photos from site ${id}`);

      // 5. Delete site species relationships
      const deletedSiteSpecies = await tx.sitesSpecies.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedSiteSpecies.count} site-species relationships for site ${id}`);

      // 6. Delete plantation data
      const deletedPlantation = await tx.plantationData.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedPlantation.count} plantation records for site ${id}`);

      // 7. Delete solar data
      const deletedSolar = await tx.solarData.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedSolar.count} solar records for site ${id}`);

      // 8. Delete waste data
      const deletedWaste = await tx.wasteData.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedWaste.count} waste records for site ${id}`);

      // 9. Delete sewage data
      const deletedSewage = await tx.sewageData.deleteMany({
        where: { siteId: id },
      });
      console.log(`[SITE_DELETE] Deleted ${deletedSewage.count} sewage records for site ${id}`);

      // 10. Soft delete the site
      const deletedSite = await tx.site.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      console.log(`[SITE_DELETE] Successfully soft-deleted site ${id}`);
      return deletedSite;
    });

    return result;
  }

  /**
   * Clean up orphaned boundaries for soft-deleted sites
   * This is a maintenance method to clean up data inconsistencies
   */
  async cleanupOrphanedBoundaries(): Promise<{ count: number }> {
    console.log('[CLEANUP] Starting cleanup of orphaned site boundaries...');
    
    // Find all boundaries where the site is soft-deleted
    const orphanedBoundaries = await this.prisma.siteBoundary.findMany({
      where: {
        site: {
          deletedAt: { not: null },
        },
      },
      select: { id: true, siteId: true },
    });

    console.log(`[CLEANUP] Found ${orphanedBoundaries.length} orphaned boundaries`);

    if (orphanedBoundaries.length === 0) {
      return { count: 0 };
    }

    // Delete them
    const deleted = await this.prisma.siteBoundary.deleteMany({
      where: {
        id: {
          in: orphanedBoundaries.map(b => b.id),
        },
      },
    });

    console.log(`[CLEANUP] Deleted ${deleted.count} orphaned boundaries`);
    return { count: deleted.count };
  }

  async getYearlyMetrics(siteId: number, years?: number[]) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const where: any = { siteId };
    if (years && years.length > 0) {
      where.year = { in: years };
    }

    return this.prisma.yearlyMetrics.findMany({
      where,
      include: {
        baseRaster: {
          select: {
            id: true,
            fileName: true,
            minioUrl: true,
            createdAt: true,
          },
        },
        classifiedRaster: {
          select: {
            id: true,
            fileName: true,
            minioUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { year: 'desc' },
    });
  }

  async getBoundary(siteId: number, year: number) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const boundary = await this.prisma.siteBoundary.findFirst({
      where: {
        siteId,
        year,
      },
    });

    if (!boundary) {
      throw new NotFoundException(`Boundary for site ${siteId} and year ${year} not found`);
    }

    return boundary;
  }

  async getRastersForYear(siteId: number, year: number) {
    const metrics = await this.prisma.yearlyMetrics.findFirst({
      where: {
        siteId,
        year,
      },
      include: {
        baseRaster: true,
        classifiedRaster: true,
      },
    });

    if (!metrics) {
      throw new NotFoundException(`No rasters found for site ${siteId} and year ${year}`);
    }

    return {
      year,
      baseRaster: metrics.baseRaster,
      classifiedRaster: metrics.classifiedRaster,
      metrics: {
        treeCanopy: metrics.treeCanopy,
        greenArea: metrics.greenArea,
        barrenLand: metrics.barrenLand,
        wetLand: metrics.wetLand,
      },
    };
  }
}
