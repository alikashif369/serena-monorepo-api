import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VectorsService {
  constructor(private prisma: PrismaService) {}

  async create(siteId: number, year: number, geometry: any, properties?: any) {
    // Verify site exists and is not soft-deleted
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site || site.deletedAt !== null) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    try {
      const created = await this.prisma.siteBoundary.create({
        data: {
          siteId,
          year,
          geometry: geometry,
          properties: properties,
        },
      });

      // Store PostGIS geometry for spatial queries
      // geometry is the geometry object directly (e.g., {type: "Polygon", coordinates: [...]})
      try {
        // Ensure we store geometry with explicit SRID 4326 (GeoJSON must be lon/lat)
        await this.prisma.$executeRaw`
          UPDATE "spatial"."site_boundaries"
          SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}::jsonb), 4326)
          WHERE id = ${created.id};
        `;
        console.log("[VECTOR] PostGIS geom updated for boundary (SRID=4326):", created.id);
      } catch (geoErr) {
        console.warn("[VECTOR] PostGIS update failed (non-critical):", geoErr);
        // Continue anyway - JSON geometry is stored and usable
      }

      return this.findOne(created.id);
    } catch (error: any) {
      if (error?.code === 'P2002' && error?.meta?.target?.includes('siteId') && error?.meta?.target?.includes('year')) {
        throw new ConflictException(`A boundary already exists for site ${siteId} and year ${year}. Use PATCH /api/v1/vectors/{id} to update it, or choose a different year.`);
      }
      throw error;
    }
  }

  async findAll(query?: any) {
    const where: any = {
      // Only include boundaries for sites that are not soft-deleted
      site: {
        deletedAt: null,
      },
    };

    if (query?.siteId) where.siteId = parseInt(query.siteId);
    if (query?.year) where.year = parseInt(query.year);
    if (query?.minYear) where.year = { gte: parseInt(query.minYear) };
    if (query?.maxYear) where.year = { lte: parseInt(query.maxYear) };

    return this.prisma.siteBoundary.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            deletedAt: true, // Include deletedAt so frontend can double-check
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [{ siteId: 'asc' }, { year: 'desc' }],
    });
  }

  async findOne(id: string) {
    const boundary = await this.prisma.siteBoundary.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            deletedAt: true,
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
          },
        },
      },
    });

    // Check if boundary exists and site is not soft-deleted
    if (!boundary || boundary.site?.deletedAt !== null) {
      throw new NotFoundException(`Boundary with ID ${id} not found`);
    }

    return boundary;
  }

  async update(id: string, geometry?: any, properties?: any) {
    const boundary = await this.prisma.siteBoundary.findUnique({
      where: { id },
      include: {
        site: {
          select: { deletedAt: true },
        },
      },
    });

    // Check if boundary exists and site is not soft-deleted
    if (!boundary || boundary.site?.deletedAt !== null) {
      throw new NotFoundException(`Boundary with ID ${id} not found`);
    }

    const data: any = {};
    if (geometry) data.geometry = geometry;
    if (properties) data.properties = properties;

    const updated = await this.prisma.siteBoundary.update({
      where: { id },
      data,
    });

    if (geometry) {
      // On update, also set the geom column with correct SRID
      try {
        await this.prisma.$executeRaw`
          UPDATE "spatial"."site_boundaries"
          SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}::jsonb), 4326)
          WHERE id = ${id};
        `;
      } catch (geoErr) {
        console.warn("[VECTOR] PostGIS update failed on update (non-critical):", geoErr);
      }
    }

    return this.findOne(updated.id);
  }

  async delete(id: string) {
    const boundary = await this.prisma.siteBoundary.findUnique({
      where: { id },
      include: {
        site: {
          select: { deletedAt: true },
        },
      },
    });

    // Check if boundary exists and site is not soft-deleted
    if (!boundary || boundary.site?.deletedAt !== null) {
      throw new NotFoundException(`Boundary with ID ${id} not found`);
    }

    await this.prisma.siteBoundary.delete({
      where: { id },
    });

    return { message: `Boundary ${id} deleted successfully` };
  }

  async searchWithin(_geometry: any, siteIds?: number[]) {
    // This would use PostGIS ST_Within or ST_Intersects function
    // For now, return filtered boundaries
    const where: any = {
      // Only include boundaries for sites that are not soft-deleted
      site: {
        deletedAt: null,
      },
    };

    if (siteIds && siteIds.length > 0) {
      where.siteId = { in: siteIds };
    }

    // TODO: Implement actual spatial query using Prisma raw SQL with PostGIS
    // Example: SELECT * FROM spatial.site_boundaries WHERE ST_Within(geometry, ST_GeomFromGeoJSON($1))

    return this.prisma.siteBoundary.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
