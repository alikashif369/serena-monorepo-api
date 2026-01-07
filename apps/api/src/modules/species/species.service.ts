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
      // Handle both scientificName and botanicalName (legacy)
      const scientificName = dto.scientificName || dto.botanicalName;
      const botanicalName = dto.botanicalName || dto.scientificName;

      if (!scientificName) {
        throw new Error('Scientific name is required');
      }

      return await this.prisma.species.create({
        data: {
          scientificName,
          botanicalName,
          localName: dto.localName,
          englishName: dto.englishName,
          description: dto.description,
          uses: dto.uses,
          // Optional fields
          code: dto.code || undefined,
          imagePath: dto.imagePath || undefined,
          image1Url: dto.image1Url || undefined,
          image2Url: dto.image2Url || undefined,
          image3Url: dto.image3Url || undefined,
          image4Url: dto.image4Url || undefined,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Species with scientific name already exists`);
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

    // Prepare update data
    const updateData: any = {};

    // Handle scientificName and botanicalName
    if (dto.scientificName !== undefined) {
      updateData.scientificName = dto.scientificName;
      // Also update botanicalName to keep them in sync
      if (!dto.botanicalName) {
        updateData.botanicalName = dto.scientificName;
      }
    }
    if (dto.botanicalName !== undefined) {
      updateData.botanicalName = dto.botanicalName;
    }

    // Other fields
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.localName !== undefined) updateData.localName = dto.localName;
    if (dto.englishName !== undefined) updateData.englishName = dto.englishName;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.uses !== undefined) updateData.uses = dto.uses;
    if (dto.imagePath !== undefined) updateData.imagePath = dto.imagePath;
    if (dto.image1Url !== undefined) updateData.image1Url = dto.image1Url;
    if (dto.image2Url !== undefined) updateData.image2Url = dto.image2Url;
    if (dto.image3Url !== undefined) updateData.image3Url = dto.image3Url;
    if (dto.image4Url !== undefined) updateData.image4Url = dto.image4Url;

    return this.prisma.species.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number) {
    const species = await this.prisma.species.findUnique({
      where: { id },
    });

    if (!species) {
      throw new NotFoundException(`Species with ID ${id} not found`);
    }

    return this.prisma.species.delete({
      where: { id },
    });
  }
}
