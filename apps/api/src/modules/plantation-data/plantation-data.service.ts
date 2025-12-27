import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantationDataDto } from './dto/create-plantation-data.dto';
import { UpdatePlantationDataDto } from './dto/update-plantation-data.dto';

@Injectable()
export class PlantationDataService {
  constructor(private prisma: PrismaService) {}

  async findAll(siteId?: number) {
    const where: any = {};
    if (siteId) where.siteId = siteId;

    return this.prisma.plantationData.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
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
      orderBy: { site: { name: 'asc' } },
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.plantationData.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    if (!data) {
      throw new NotFoundException(`PlantationData with ID ${id} not found`);
    }

    return data;
  }

  async findBySite(siteId: number) {
    const data = await this.prisma.plantationData.findUnique({
      where: { siteId },
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

    if (!data) {
      throw new NotFoundException(`PlantationData for site ${siteId} not found`);
    }

    return data;
  }

  async create(dto: CreatePlantationDataDto) {
    // Check if site exists
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    // Check if data already exists for this site
    const existing = await this.prisma.plantationData.findUnique({
      where: { siteId: dto.siteId },
    });

    if (existing) {
      throw new ConflictException(`PlantationData already exists for site ${dto.siteId}`);
    }

    return this.prisma.plantationData.create({
      data: dto,
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

  async update(id: number, dto: UpdatePlantationDataDto) {
    const existing = await this.prisma.plantationData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`PlantationData with ID ${id} not found`);
    }

    return this.prisma.plantationData.update({
      where: { id },
      data: dto,
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

  async delete(id: number) {
    const existing = await this.prisma.plantationData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`PlantationData with ID ${id} not found`);
    }

    return this.prisma.plantationData.delete({
      where: { id },
    });
  }

  async upsert(dto: CreatePlantationDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    return this.prisma.plantationData.upsert({
      where: { siteId: dto.siteId },
      create: dto,
      update: {
        plants: dto.plants,
        species: dto.species,
      },
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
