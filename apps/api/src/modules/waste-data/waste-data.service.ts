import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWasteDataDto } from './dto/create-waste-data.dto';
import { UpdateWasteDataDto } from './dto/update-waste-data.dto';

@Injectable()
export class WasteDataService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { siteId?: number; year?: number }) {
    const where: any = {};
    if (query?.siteId) where.siteId = query.siteId;
    if (query?.year) where.year = query.year;

    return this.prisma.wasteData.findMany({
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
      orderBy: [{ siteId: 'asc' }, { year: 'desc' }],
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.wasteData.findUnique({
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
      throw new NotFoundException(`WasteData with ID ${id} not found`);
    }

    return data;
  }

  async findBySiteAndYear(siteId: number, year: number) {
    const data = await this.prisma.wasteData.findFirst({
      where: { siteId, year },
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
      throw new NotFoundException(`WasteData for site ${siteId} and year ${year} not found`);
    }

    return data;
  }

  async create(dto: CreateWasteDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    const existing = await this.prisma.wasteData.findFirst({
      where: { siteId: dto.siteId, year: dto.year },
    });

    if (existing) {
      throw new ConflictException(`WasteData already exists for site ${dto.siteId} and year ${dto.year}`);
    }

    return this.prisma.wasteData.create({
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

  async update(id: number, dto: UpdateWasteDataDto) {
    const existing = await this.prisma.wasteData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`WasteData with ID ${id} not found`);
    }

    return this.prisma.wasteData.update({
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
    const existing = await this.prisma.wasteData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`WasteData with ID ${id} not found`);
    }

    return this.prisma.wasteData.delete({
      where: { id },
    });
  }

  async upsert(dto: CreateWasteDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    return this.prisma.wasteData.upsert({
      where: {
        siteId_year: {
          siteId: dto.siteId,
          year: dto.year,
        },
      },
      create: dto,
      update: {
        organicWaste: dto.organicWaste,
        compostReceived: dto.compostReceived,
        methaneRecovered: dto.methaneRecovered,
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
