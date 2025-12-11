import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { YearlyMetricsService } from './yearly-metrics.service';

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
}
