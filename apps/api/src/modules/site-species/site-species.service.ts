import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddSpeciesToSiteDto, UpdateSiteSpeciesDto } from './dto/site-species.dto';

@Injectable()
export class SiteSpeciesService {
  constructor(private prisma: PrismaService) {}

  // Get all species for a site
  async findBySite(siteId: number) {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    return this.prisma.sitesSpecies.findMany({
      where: { siteId },
      include: {
        species: {
          select: {
            id: true,
            code: true,
            scientificName: true,
            botanicalName: true,
            localName: true,
            englishName: true,
            description: true,
            uses: true,
            image1Url: true,
            image2Url: true,
            image3Url: true,
            image4Url: true,
          },
        },
      },
      orderBy: { species: { scientificName: 'asc' } },
    });
  }

  // Get all sites for a species
  async findBySpecies(speciesId: number) {
    const species = await this.prisma.species.findFirst({ where: { id: speciesId } });
    if (!species) {
      throw new NotFoundException(`Species with ID ${speciesId} not found`);
    }

    return this.prisma.sitesSpecies.findMany({
      where: { speciesId },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            district: true,
            city: true,
          },
        },
      },
      orderBy: { site: { name: 'asc' } },
    });
  }

  // Add a species to a site
  async addSpeciesToSite(siteId: number, dto: AddSpeciesToSiteDto) {
    // Verify site exists
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    // Verify species exists
    const species = await this.prisma.species.findFirst({ where: { id: dto.speciesId } });
    if (!species) {
      throw new NotFoundException(`Species with ID ${dto.speciesId} not found`);
    }

    // Check if already exists
    const existing = await this.prisma.sitesSpecies.findUnique({
      where: {
        siteId_speciesId: {
          siteId,
          speciesId: dto.speciesId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Species ${species.scientificName} is already added to this site`);
    }

    return this.prisma.sitesSpecies.create({
      data: {
        siteId,
        speciesId: dto.speciesId,
        plantedCount: dto.plantedCount,
        plantedYear: dto.plantedYear,
      },
      include: {
        species: {
          select: {
            id: true,
            code: true,
            scientificName: true,
            botanicalName: true,
            localName: true,
            englishName: true,
            description: true,
            uses: true,
            image1Url: true,
            image2Url: true,
            image3Url: true,
            image4Url: true,
          },
        },
      },
    });
  }

  // Update site-species relationship
  async update(siteId: number, speciesId: number, dto: UpdateSiteSpeciesDto) {
    const existing = await this.prisma.sitesSpecies.findUnique({
      where: {
        siteId_speciesId: { siteId, speciesId },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Species ${speciesId} not found at site ${siteId}`);
    }

    return this.prisma.sitesSpecies.update({
      where: {
        siteId_speciesId: { siteId, speciesId },
      },
      data: {
        plantedCount: dto.plantedCount,
        plantedYear: dto.plantedYear,
      },
      include: {
        species: {
          select: {
            id: true,
            code: true,
            scientificName: true,
            botanicalName: true,
            localName: true,
            englishName: true,
            description: true,
            uses: true,
            image1Url: true,
            image2Url: true,
            image3Url: true,
            image4Url: true,
          },
        },
      },
    });
  }

  // Remove a species from a site
  async removeSpeciesFromSite(siteId: number, speciesId: number) {
    const existing = await this.prisma.sitesSpecies.findUnique({
      where: {
        siteId_speciesId: { siteId, speciesId },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Species ${speciesId} not found at site ${siteId}`);
    }

    return this.prisma.sitesSpecies.delete({
      where: {
        siteId_speciesId: { siteId, speciesId },
      },
    });
  }

  // Get summary statistics
  async getSiteSpeciesStats(siteId: number) {
    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const records = await this.prisma.sitesSpecies.findMany({
      where: { siteId },
    });

    return {
      totalSpecies: records.length,
      totalPlanted: records.reduce((sum, r) => sum + (r.plantedCount || 0), 0),
      plantedYears: [...new Set(records.map(r => r.plantedYear).filter(Boolean))].sort(),
    };
  }
}
