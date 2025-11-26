import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';
import { CreateVectorLayerDto } from './dto/create-vector-layer.dto';
import { UpdateVectorLayerDto } from './dto/update-vector-layer.dto';

@Injectable()
export class VectorServiceService {
  constructor(private prisma: PrismaService) {}

  async create(createVectorLayerDto: CreateVectorLayerDto, userId?: string) {
    const { geometry, properties, ...rest } = createVectorLayerDto;
    
    return this.prisma.vectorLayer.create({
      data: {
        ...rest,
        geometry: geometry as any, // Store as JSONB
        properties: properties as any,
        userId: userId || createVectorLayerDto.userId,
      },
    });
  }

  async findAll() {
    return this.prisma.vectorLayer.findMany({
      where: {
        deletedAt: null, // Only return non-deleted records
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const layer = await this.prisma.vectorLayer.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
    });
    
    if (!layer) {
      throw new NotFoundException(`Vector layer with ID ${id} not found`);
    }
    
    return layer;
  }

  async update(id: string, updateVectorLayerDto: UpdateVectorLayerDto) {
    await this.findOne(id); // Check if exists and not deleted
    
    const { geometry, properties, ...rest } = updateVectorLayerDto;
    
    return this.prisma.vectorLayer.update({
      where: { id },
      data: {
        ...rest,
        ...(geometry && { geometry: geometry as any }),
        ...(properties && { properties: properties as any }),
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists and not deleted
    
    // Soft delete
    return this.prisma.vectorLayer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
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