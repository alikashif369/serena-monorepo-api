import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';
import { CreateVectorLayerDto } from './dto/create-vector-layer.dto';
import { UpdateVectorLayerDto } from './dto/update-vector-layer.dto';

@Injectable()
export class VectorServiceService {
  constructor(private prisma: PrismaService) {}

  async create(createVectorLayerDto: CreateVectorLayerDto, userId?: string) {
    const { geometry, properties, ...rest } = createVectorLayerDto;
    
    // Convert GeoJSON to PostGIS geometry using raw SQL
    const geojsonString = JSON.stringify(geometry);
    
    const layer = await this.prisma.$queryRaw`
      INSERT INTO vector_layers (name, description, geometry, geom, properties, "userId", "createdAt", "updatedAt")
      VALUES (
        ${rest.name},
        ${rest.description || null},
        ${geojsonString}::jsonb,
        ST_GeomFromGeoJSON(${geojsonString}),
        ${JSON.stringify(properties)}::jsonb,
        ${userId || createVectorLayerDto.userId},
        NOW(),
        NOW()
      )
      RETURNING id, name, description, geometry, properties, "userId", "createdAt", "updatedAt"
    `;

    const created = Array.isArray(layer) ? layer[0] : layer;

    return {
      success: true,
      message: 'Vector layer created successfully',
      data: created,
    };
  }

  async findAll() {
    const layers = await this.prisma.vectorLayer.findMany({
      where: {
        deletedAt: null, // Only return non-deleted records
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        geometry: true,
        properties: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      count: layers.length,
      data: layers,
    };
  }

  async findOne(id: string) {
    const layer = await this.prisma.vectorLayer.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        geometry: true,
        properties: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!layer) {
      throw new NotFoundException(`Vector layer with ID ${id} not found`);
    }
    
    return {
      success: true,
      data: layer,
    };
  }

  async update(id: string, updateVectorLayerDto: UpdateVectorLayerDto) {
    // Check if exists (will throw if not found)
    const exists = await this.prisma.vectorLayer.findFirst({
      where: { id, deletedAt: null },
    });
    
    if (!exists) {
      throw new NotFoundException(`Vector layer with ID ${id} not found`);
    }
    
    const { geometry, properties, ...rest } = updateVectorLayerDto;
    
    // If geometry is being updated, also update the PostGIS geom column
    if (geometry) {
      const geojsonString = JSON.stringify(geometry);
      const updated = await this.prisma.$queryRaw`
        UPDATE vector_layers
        SET 
          name = COALESCE(${rest.name}, name),
          description = COALESCE(${rest.description}, description),
          geometry = ${geojsonString}::jsonb,
          geom = ST_GeomFromGeoJSON(${geojsonString}),
          properties = COALESCE(${JSON.stringify(properties)}::jsonb, properties),
          "updatedAt" = NOW()
        WHERE id = ${id}::uuid
        RETURNING id, name, description, geometry, properties, "userId", "createdAt", "updatedAt"
      `;

      const result = Array.isArray(updated) ? updated[0] : updated;

      return {
        success: true,
        message: 'Vector layer updated successfully',
        data: result,
      };
    }
    
    // If no geometry update, use regular Prisma update
    const updated = await this.prisma.vectorLayer.update({
      where: { id },
      data: {
        ...rest,
        ...(properties && { properties: properties as any }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        geometry: true,
        properties: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Vector layer updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    // Check if exists
    const exists = await this.prisma.vectorLayer.findFirst({
      where: { id, deletedAt: null },
    });
    
    if (!exists) {
      throw new NotFoundException(`Vector layer with ID ${id} not found`);
    }
    
    // Soft delete
    await this.prisma.vectorLayer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Vector layer deleted successfully',
      data: {
        id,
        deletedAt: new Date(),
      },
    };
  }

  // Additional geospatial query methods
  async findByBoundingBox(minLng: number, minLat: number, maxLng: number, maxLat: number) {
    return this.prisma.$queryRaw`
      SELECT * FROM vector_layers
      WHERE deleted_at IS NULL
      AND ST_Intersects(
        geom,
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      )
    `;
  }

  async findWithinDistance(lng: number, lat: number, distanceMeters: number) {
    return this.prisma.$queryRaw`
      SELECT *, 
        ST_Distance(
          geom,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) as distance
      FROM vector_layers
      WHERE deleted_at IS NULL
      AND ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${distanceMeters}
      )
      ORDER BY distance
    `;
  }
}