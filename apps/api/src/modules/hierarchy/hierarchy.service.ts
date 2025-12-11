import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HierarchyService {
  private cachedTree: any = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  async getFullTree() {
    console.log("[HIERARCHY_SERVICE] getFullTree called");
    // Check cache
    const now = Date.now();
    if (this.cachedTree && now - this.cacheTimestamp < this.CACHE_DURATION) {
      console.log("[HIERARCHY_SERVICE] Returning cached tree, orgs count:", this.cachedTree.length);
      return this.cachedTree;
    }

    console.log("[HIERARCHY_SERVICE] Building new tree from database");
    // Build full hierarchy tree
    const organizations = await this.prisma.organization.findMany({
      include: {
        regions: {
          include: {
            categories: {
              include: {
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
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    console.log("[HIERARCHY_SERVICE] Found orgs count:", organizations.length);
    if (organizations.length > 0) {
      console.log("[HIERARCHY_SERVICE] First org:", organizations[0]?.name, "regions count:", organizations[0]?.regions?.length);
    }

    // Cache the result
    this.cachedTree = organizations;
    this.cacheTimestamp = now;

    return organizations;
  }

  /**
   * Invalidate the cached hierarchy tree
   * Call this after creating/updating/deleting organizations, regions, categories, subcategories, or sites
   */
  invalidateCache() {
    console.log("[HIERARCHY_SERVICE] Cache invalidated");
    this.cachedTree = null;
    this.cacheTimestamp = 0;
  }

  async searchSites(query: string, filters?: any) {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
        { district: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Apply additional filters
    if (filters?.categoryId) where.categoryId = parseInt(filters.categoryId);
    if (filters?.siteType) where.siteType = filters.siteType;

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
      take: 50, // Limit results
    });
  }

  async getStatistics() {
    const [
      totalOrganizations,
      totalRegions,
      totalCategories,
      totalSubCategories,
      totalSites,
      totalMetrics,
      totalBoundaries,
      totalRasters,
      sitesByType,
      categoriesByType,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.region.count(),
      this.prisma.category.count(),
      this.prisma.subCategory.count(),
      this.prisma.site.count(),
      this.prisma.yearlyMetrics.count(),
      this.prisma.siteBoundary.count(),
      this.prisma.raster.count(),
      this.prisma.site.groupBy({
        by: ['siteType'],
        _count: { id: true },
      }),
      this.prisma.category.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
    ]);

    // Calculate total area across all sites
    const siteAreas = await this.prisma.site.aggregate({
      _sum: { area: true },
    });

    return {
      counts: {
        organizations: totalOrganizations,
        regions: totalRegions,
        categories: totalCategories,
        subCategories: totalSubCategories,
        sites: totalSites,
        yearlyMetrics: totalMetrics,
        boundaries: totalBoundaries,
        rasters: totalRasters,
      },
      groupedStats: {
        sitesByType: sitesByType.map((s) => ({
          type: s.siteType,
          count: s._count.id,
        })),
        categoriesByType: categoriesByType.map((c) => ({
          type: c.type,
          count: c._count.id,
        })),
      },
      totalArea: siteAreas._sum.area || 0,
    };
  }

  async clearCache() {
    console.log("[HIERARCHY_SERVICE] Clearing cache");
    this.cachedTree = null;
    this.cacheTimestamp = 0;
    return { message: "Cache cleared" };
  }

  async debugDatabase() {
    console.log("[HIERARCHY_SERVICE] Starting database debug");
    
    const orgCount = await this.prisma.organization.count();
    console.log("[HIERARCHY_SERVICE_DEBUG] Organizations count:", orgCount);
    
    const orgs = await this.prisma.organization.findMany({
      select: { id: true, name: true, _count: { select: { regions: true } } }
    });
    console.log("[HIERARCHY_SERVICE_DEBUG] Organizations:", orgs);

    const regionCount = await this.prisma.region.count();
    console.log("[HIERARCHY_SERVICE_DEBUG] Regions count:", regionCount);

    const categoryCount = await this.prisma.category.count();
    console.log("[HIERARCHY_SERVICE_DEBUG] Categories count:", categoryCount);

    const subCatCount = await this.prisma.subCategory.count();
    console.log("[HIERARCHY_SERVICE_DEBUG] SubCategories count:", subCatCount);

    const siteCount = await this.prisma.site.count();
    console.log("[HIERARCHY_SERVICE_DEBUG] Sites count:", siteCount);

    return {
      organizations: orgCount,
      regions: regionCount,
      categories: categoryCount,
      subCategories: subCatCount,
      sites: siteCount,
      details: orgs,
    };
  }
}
