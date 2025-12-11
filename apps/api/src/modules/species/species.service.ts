import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpeciesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: any) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { botanicalName: { contains: query.search, mode: 'insensitive' } },
        { localName: { contains: query.search, mode: 'insensitive' } },
        { englishName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.species.findMany({
      where,
      orderBy: { botanicalName: 'asc' },
    });
  }

  async findOne(id: number) {
    const species = await this.prisma.species.findUnique({
      where: { id },
    });

    if (!species) {
      throw new NotFoundException(`Species with ID ${id} not found`);
    }

    return species;
  }

  async create(dto: any) {
    try {
      return await this.prisma.species.create({
        data: {
          scientificName: dto.scientificName,
          localName: dto.localName,
          englishName: dto.englishName,
          description: dto.description,
          uses: dto.uses,
          // Legacy fields (optional, for backward compatibility)
          code: dto.code,
          botanicalName: dto.botanicalName || dto.scientificName,
          imagePath: dto.imagePath,
          // New image URLs
          image1Url: dto.image1Url,
          image2Url: dto.image2Url,
          image3Url: dto.image3Url,
          image4Url: dto.image4Url,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Species with scientific name ${dto.scientificName} already exists`);
      }
      throw error;
    }
  }

  async update(id: number, dto: any) {
    const species = await this.prisma.species.findUnique({
      where: { id },
    });

    if (!species) {
      throw new NotFoundException(`Species with ID ${id} not found`);
    }

    return this.prisma.species.update({
      where: { id },
      data: {
        ...(dto.scientificName !== undefined && { scientificName: dto.scientificName }),
        ...(dto.localName !== undefined && { localName: dto.localName }),
        ...(dto.englishName !== undefined && { englishName: dto.englishName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.uses !== undefined && { uses: dto.uses }),
        // Legacy fields
        ...(dto.botanicalName !== undefined && { botanicalName: dto.botanicalName }),
        ...(dto.imagePath !== undefined && { imagePath: dto.imagePath }),
        // New image URLs
        ...(dto.image1Url !== undefined && { image1Url: dto.image1Url }),
        ...(dto.image2Url !== undefined && { image2Url: dto.image2Url }),
        ...(dto.image3Url !== undefined && { image3Url: dto.image3Url }),
        ...(dto.image4Url !== undefined && { image4Url: dto.image4Url }),
      },
    });
  }
}
