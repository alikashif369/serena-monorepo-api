import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolarDataDto } from './dto/create-solar-data.dto';
import { UpdateSolarDataDto } from './dto/update-solar-data.dto';

@Injectable()
export class SolarDataService {
  constructor(private prisma: PrismaService) {}

  async findAll(siteId?: number) {
    const where: any = {};
    if (siteId) where.siteId = siteId;

    return this.prisma.solarData.findMany({
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
    const data = await this.prisma.solarData.findUnique({
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
      throw new NotFoundException(`SolarData with ID ${id} not found`);
    }

    return data;
  }

  async findBySite(siteId: number) {
    const data = await this.prisma.solarData.findUnique({
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
      throw new NotFoundException(`SolarData for site ${siteId} not found`);
    }

    return data;
  }

  async create(dto: CreateSolarDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    const existing = await this.prisma.solarData.findUnique({
      where: { siteId: dto.siteId },
    });

    if (existing) {
      throw new ConflictException(`SolarData already exists for site ${dto.siteId}`);
    }

    return this.prisma.solarData.create({
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

  async update(id: number, dto: UpdateSolarDataDto) {
    const existing = await this.prisma.solarData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`SolarData with ID ${id} not found`);
    }

    return this.prisma.solarData.update({
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
    const existing = await this.prisma.solarData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`SolarData with ID ${id} not found`);
    }

    return this.prisma.solarData.delete({
      where: { id },
    });
  }

  async upsert(dto: CreateSolarDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    return this.prisma.solarData.upsert({
      where: { siteId: dto.siteId },
      create: dto,
      update: {
        installationYear: dto.installationYear,
        capacityKwh: dto.capacityKwh,
        quarterlyProduction: dto.quarterlyProduction,
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
