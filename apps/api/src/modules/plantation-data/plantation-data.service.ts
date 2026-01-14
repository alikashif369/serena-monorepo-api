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

    // Create plantation data
    const plantationData = await this.prisma.plantationData.create({
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

    // Sync species to SitesSpecies table
    await this.syncSpeciesToSite(dto.siteId, dto.species, dto.plants);

    return plantationData;
  }

  async update(id: number, dto: UpdatePlantationDataDto) {
    const existing = await this.prisma.plantationData.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`PlantationData with ID ${id} not found`);
    }

    // Update plantation data
    const updated = await this.prisma.plantationData.update({
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

    // Sync species to SitesSpecies table if species were updated
    if (dto.species) {
      await this.syncSpeciesToSite(existing.siteId, dto.species, dto.plants || existing.plants);
    }

    return updated;
  }

  // Helper method to sync species array to SitesSpecies table
  private async syncSpeciesToSite(siteId: number, speciesCodes: string[], totalPlants: number) {
    if (!speciesCodes || speciesCodes.length === 0) return;

    // Find species by codes (case-insensitive, flexible matching)
    const speciesList = await this.prisma.species.findMany({
      where: {
        OR: speciesCodes.flatMap(code => [
          // Exact match on code
          { code: { equals: code, mode: 'insensitive' } },
          // Exact match on scientificName
          { scientificName: { equals: code, mode: 'insensitive' } },
          // Exact match on englishName
          { englishName: { equals: code, mode: 'insensitive' } },
          // Exact match on localName
          { localName: { equals: code, mode: 'insensitive' } },
          // Partial match (contains) on scientificName
          { scientificName: { contains: code, mode: 'insensitive' } },
        ]),
      },
    });

    // Calculate plants per species (distribute evenly if multiple species)
    const plantsPerSpecies = Math.floor(totalPlants / speciesCodes.length);

    // Create/update SitesSpecies records
    for (const species of speciesList) {
      await this.prisma.sitesSpecies.upsert({
        where: {
          siteId_speciesId: {
            siteId,
            speciesId: species.id,
          },
        },
        create: {
          siteId,
          speciesId: species.id,
          plantedCount: plantsPerSpecies,
          plantedYear: new Date().getFullYear(),
        },
        update: {
          plantedCount: plantsPerSpecies,
        },
      });
    }
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
