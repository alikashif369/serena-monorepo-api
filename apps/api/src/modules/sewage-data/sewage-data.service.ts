import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSewageDataDto } from './dto/create-sewage-data.dto';
import { UpdateSewageDataDto } from './dto/update-sewage-data.dto';

@Injectable()
export class SewageDataService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { siteId?: number; year?: number }) {
    const where: any = {};
    if (query?.siteId) where.siteId = query.siteId;
    if (query?.year) where.year = query.year;

    return this.prisma.sewageData.findMany({
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
    const data = await this.prisma.sewageData.findUnique({
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
      throw new NotFoundException(`SewageData with ID ${id} not found`);
    }

    return data;
  }

  async findBySiteAndYear(siteId: number, year: number) {
    const data = await this.prisma.sewageData.findFirst({
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
      throw new NotFoundException(`SewageData for site ${siteId} and year ${year} not found`);
    }

    return data;
  }

  async create(dto: CreateSewageDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    const existing = await this.prisma.sewageData.findFirst({
      where: { siteId: dto.siteId, year: dto.year },
    });

    if (existing) {
      throw new ConflictException(`SewageData already exists for site ${dto.siteId} and year ${dto.year}`);
    }

    return this.prisma.sewageData.create({
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

  async update(id: number, dto: UpdateSewageDataDto) {
    const existing = await this.prisma.sewageData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`SewageData with ID ${id} not found`);
    }

    return this.prisma.sewageData.update({
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
    const existing = await this.prisma.sewageData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`SewageData with ID ${id} not found`);
    }

    return this.prisma.sewageData.delete({
      where: { id },
    });
  }

  async upsert(dto: CreateSewageDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    return this.prisma.sewageData.upsert({
      where: {
        siteId_year: {
          siteId: dto.siteId,
          year: dto.year,
        },
      },
      create: dto,
      update: {
        recoveryRatio: dto.recoveryRatio,
        methaneSaved: dto.methaneSaved,
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
