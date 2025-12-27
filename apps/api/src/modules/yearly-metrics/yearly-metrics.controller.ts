import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { YearlyMetricsService } from './yearly-metrics.service';
import { CreateYearlyMetricsDto } from './dto/create-yearly-metrics.dto';
import { UpdateYearlyMetricsDto } from './dto/update-yearly-metrics.dto';

@ApiTags('Yearly-Metrics')
@Controller('yearly-metrics')
export class YearlyMetricsController {
  constructor(private yearlyMetricsService: YearlyMetricsService) {}

  @Get()
  @ApiOperation({ summary: 'List yearly metrics with optional filters' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID', type: Number })
  @ApiQuery({ name: 'year', required: false, description: 'Filter by year', type: Number })
  async findAll(@Query() query: any) {
    return this.yearlyMetricsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get yearly metrics by ID' })
  @ApiParam({ name: 'id', description: 'Yearly Metrics ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.yearlyMetricsService.findOne(parseInt(id));
  }

  @Get('site/:siteId/year/:year')
  @ApiOperation({ summary: 'Get land cover metrics for site and year' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiParam({ name: 'year', description: 'Year', type: Number })
  async findBySiteAndYear(
    @Param('siteId') siteId: string,
    @Param('year') year: string,
  ) {
    return this.yearlyMetricsService.findBySiteAndYear(
      parseInt(siteId),
      parseInt(year),
    );
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get all metrics for site (optional year filter)' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiQuery({ name: 'years', required: false, description: 'Comma-separated years (e.g., 2020,2021,2022)' })
  async findBySite(@Param('siteId') siteId: string, @Query('years') years?: string) {
    const yearList = years ? years.split(',').map(Number) : undefined;
    return this.yearlyMetricsService.findBySite(parseInt(siteId), yearList);
  }

  @Post()
  @ApiOperation({ summary: 'Create yearly metrics for a site' })
  @ApiBody({ type: CreateYearlyMetricsDto })
  async create(@Body() dto: CreateYearlyMetricsDto) {
    return this.yearlyMetricsService.create(dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update yearly metrics for a site (upsert)' })
  @ApiBody({ type: CreateYearlyMetricsDto })
  async upsert(@Body() dto: CreateYearlyMetricsDto) {
    return this.yearlyMetricsService.upsert(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update yearly metrics' })
  @ApiParam({ name: 'id', description: 'Yearly Metrics ID', type: Number })
  @ApiBody({ type: UpdateYearlyMetricsDto })
  async update(@Param('id') id: string, @Body() dto: UpdateYearlyMetricsDto) {
    return this.yearlyMetricsService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete yearly metrics' })
  @ApiParam({ name: 'id', description: 'Yearly Metrics ID', type: Number })
  async delete(@Param('id') id: string) {
    return this.yearlyMetricsService.delete(parseInt(id));
  }
}
