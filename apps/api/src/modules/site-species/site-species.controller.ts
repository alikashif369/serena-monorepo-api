import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SiteSpeciesService } from './site-species.service';
import { AddSpeciesToSiteDto, UpdateSiteSpeciesDto } from './dto/site-species.dto';

// Dashboard-friendly controller for querying site-species by query params
@ApiTags('Site Species')
@Controller('site-species')
export class SiteSpeciesDashboardController {
  constructor(private siteSpeciesService: SiteSpeciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get species for a site (query param)' })
  @ApiQuery({ name: 'siteId', description: 'Site ID', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'List of species at the site' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async findBySiteQuery(@Query('siteId', ParseIntPipe) siteId: number) {
    return this.siteSpeciesService.findBySite(siteId);
  }
}

@ApiTags('Site Species')
@Controller('sites/:siteId/species')
export class SiteSpeciesController {
  constructor(private siteSpeciesService: SiteSpeciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all species at a site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiResponse({ status: 200, description: 'List of species at the site' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async findBySite(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.siteSpeciesService.findBySite(siteId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get species statistics for a site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  async getStats(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.siteSpeciesService.getSiteSpeciesStats(siteId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a species to a site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiBody({ type: AddSpeciesToSiteDto })
  @ApiResponse({ status: 201, description: 'Species added to site' })
  @ApiResponse({ status: 404, description: 'Site or species not found' })
  @ApiResponse({ status: 409, description: 'Species already added to site' })
  async addSpecies(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Body() dto: AddSpeciesToSiteDto,
  ) {
    return this.siteSpeciesService.addSpeciesToSite(siteId, dto);
  }

  @Patch(':speciesId')
  @ApiOperation({ summary: 'Update species details at a site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiParam({ name: 'speciesId', description: 'Species ID', type: Number })
  @ApiBody({ type: UpdateSiteSpeciesDto })
  @ApiResponse({ status: 200, description: 'Species details updated' })
  @ApiResponse({ status: 404, description: 'Site-species relationship not found' })
  async update(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Param('speciesId', ParseIntPipe) speciesId: number,
    @Body() dto: UpdateSiteSpeciesDto,
  ) {
    return this.siteSpeciesService.update(siteId, speciesId, dto);
  }

  @Delete(':speciesId')
  @ApiOperation({ summary: 'Remove a species from a site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiParam({ name: 'speciesId', description: 'Species ID', type: Number })
  @ApiResponse({ status: 200, description: 'Species removed from site' })
  @ApiResponse({ status: 404, description: 'Site-species relationship not found' })
  async removeSpecies(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Param('speciesId', ParseIntPipe) speciesId: number,
  ) {
    return this.siteSpeciesService.removeSpeciesFromSite(siteId, speciesId);
  }
}

// Additional controller for species-centric queries
@ApiTags('Species Sites')
@Controller('species/:speciesId/sites')
export class SpeciesSitesController {
  constructor(private siteSpeciesService: SiteSpeciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sites where a species is planted' })
  @ApiParam({ name: 'speciesId', description: 'Species ID', type: Number })
  @ApiResponse({ status: 200, description: 'List of sites with this species' })
  @ApiResponse({ status: 404, description: 'Species not found' })
  async findBySpecies(@Param('speciesId', ParseIntPipe) speciesId: number) {
    return this.siteSpeciesService.findBySpecies(speciesId);
  }
}
