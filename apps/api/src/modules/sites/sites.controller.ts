import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '@app/shared-config/authentication';

@ApiTags('Sites')
@Controller('sites')
export class SitesController {
  constructor(private sitesService: SitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new site' })
  @ApiBody({ type: CreateSiteDto })
  @ApiResponse({
    status: 201,
    description: 'Site created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or category/subcategory not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Site with this slug already exists in this category',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async create(@Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(createSiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all sites with optional filters' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, slug, district, or city' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID', type: Number })
  @ApiQuery({ name: 'siteType', required: false, description: 'Filter by site type' })
  async findAll(@Query() query: any) {
    return this.sitesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get site by ID with optional metrics' })
  @ApiParam({ name: 'id', description: 'Site ID', type: Number })
  @ApiQuery({ name: 'includeMetrics', required: false, description: 'Include yearly metrics' })
  async findOne(
    @Param('id') id: string,
    @Query('includeMetrics') includeMetrics?: string,
  ) {
    return this.sitesService.findOne(parseInt(id), includeMetrics === 'true');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update site' })
  @ApiParam({ name: 'id', description: 'Site ID', type: Number })
  @ApiBody({ type: UpdateSiteDto })
  @ApiResponse({
    status: 200,
    description: 'Site updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or category/subcategory not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Site with this slug already exists in this category',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    return this.sitesService.update(parseInt(id), updateSiteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete site (soft delete)' })
  @ApiParam({ name: 'id', description: 'Site ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Site deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async remove(@Param('id') id: string) {
    return this.sitesService.remove(parseInt(id));
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get yearly metrics for site' })
  @ApiParam({ name: 'id', description: 'Site ID', type: Number })
  @ApiQuery({ name: 'years', required: false, description: 'Comma-separated years (e.g., 2020,2021,2022)' })
  async getYearlyMetrics(@Param('id') id: string, @Query('years') years?: string) {
    const yearList = years ? years.split(',').map(Number) : undefined;
    return this.sitesService.getYearlyMetrics(parseInt(id), yearList);
  }

  @Get(':id/boundary/:year')
  @ApiOperation({ summary: 'Get boundary for specific year' })
  @ApiParam({ name: 'id', description: 'Site ID', type: Number })
  @ApiParam({ name: 'year', description: 'Year', type: Number })
  async getBoundary(@Param('id') id: string, @Param('year') year: string) {
    return this.sitesService.getBoundary(parseInt(id), parseInt(year));
  }

  @Get(':id/rasters/:year')
  @ApiOperation({ summary: 'Get base & classified rasters for year' })
  @ApiParam({ name: 'id', description: 'Site ID', type: Number })
  @ApiParam({ name: 'year', description: 'Year', type: Number })
  async getRastersForYear(@Param('id') id: string, @Param('year') year: string) {
    return this.sitesService.getRastersForYear(parseInt(id), parseInt(year));
  }
}
