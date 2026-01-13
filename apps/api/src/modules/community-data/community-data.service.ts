import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityDataDto } from './dto/create-community-data.dto';
import { UpdateCommunityDataDto } from './dto/update-community-data.dto';

@Injectable()
export class CommunityDataService {
  constructor(private prisma: PrismaService) {}

  async findAll(siteId?: number) {
    const where: any = {};
    if (siteId) where.siteId = siteId;

    return this.prisma.communityData.findMany({
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
      orderBy: { year: 'desc' },
    });
  }

  async findOne(id: number) {
    const data = await this.prisma.communityData.findUnique({
      where: { id },
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
      throw new NotFoundException(`CommunityData with ID ${id} not found`);
    }

    return data;
  }

  async findBySite(siteId: number) {
    // Note: CommunityData is 1:1 with Site in this implementation for simplicity
    // If multiple years are needed, this should be findMany
    const data = await this.prisma.communityData.findUnique({
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
      throw new NotFoundException(`CommunityData for site ${siteId} not found`);
    }

    return data;
  }

  async create(dto: CreateCommunityDataDto) {
    // Check if site exists
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    // Check if data already exists for this site (since it is @unique siteId)
    const existing = await this.prisma.communityData.findUnique({
      where: { siteId: dto.siteId },
    });

    if (existing) {
      throw new ConflictException(`CommunityData already exists for site ${dto.siteId}`);
    }

    return this.prisma.communityData.create({
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

  async update(id: number, dto: UpdateCommunityDataDto) {
    const existing = await this.prisma.communityData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`CommunityData with ID ${id} not found`);
    }

    return this.prisma.communityData.update({
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
    const existing = await this.prisma.communityData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`CommunityData with ID ${id} not found`);
    }

    return this.prisma.communityData.delete({
      where: { id },
    });
  }

  async upsert(dto: CreateCommunityDataDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    return this.prisma.communityData.upsert({
      where: { siteId: dto.siteId },
      create: dto,
      update: {
        year: dto.year,
        data: dto.data,
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
