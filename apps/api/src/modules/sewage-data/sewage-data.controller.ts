import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SewageDataService } from './sewage-data.service';
import { CreateSewageDataDto } from './dto/create-sewage-data.dto';
import { UpdateSewageDataDto } from './dto/update-sewage-data.dto';

@ApiTags('Sewage-Data')
@Controller('sewage-data')
export class SewageDataController {
  constructor(private sewageDataService: SewageDataService) {}

  @Get()
  @ApiOperation({ summary: 'List all sewage data' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID', type: Number })
  @ApiQuery({ name: 'year', required: false, description: 'Filter by year', type: Number })
  async findAll(@Query('siteId') siteId?: string, @Query('year') year?: string) {
    return this.sewageDataService.findAll({
      siteId: siteId ? parseInt(siteId) : undefined,
      year: year ? parseInt(year) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sewage data by ID' })
  @ApiParam({ name: 'id', description: 'Sewage Data ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.sewageDataService.findOne(parseInt(id));
  }

  @Get('site/:siteId/year/:year')
  @ApiOperation({ summary: 'Get sewage data for a specific site and year' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiParam({ name: 'year', description: 'Year', type: Number })
  async findBySiteAndYear(@Param('siteId') siteId: string, @Param('year') year: string) {
    return this.sewageDataService.findBySiteAndYear(parseInt(siteId), parseInt(year));
  }

  @Post()
  @ApiOperation({ summary: 'Create sewage data for a site' })
  @ApiBody({ type: CreateSewageDataDto })
  async create(@Body() dto: CreateSewageDataDto) {
    return this.sewageDataService.create(dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update sewage data for a site and year' })
  @ApiBody({ type: CreateSewageDataDto })
  async upsert(@Body() dto: CreateSewageDataDto) {
    return this.sewageDataService.upsert(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sewage data' })
  @ApiParam({ name: 'id', description: 'Sewage Data ID', type: Number })
  @ApiBody({ type: UpdateSewageDataDto })
  async update(@Param('id') id: string, @Body() dto: UpdateSewageDataDto) {
    return this.sewageDataService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sewage data' })
  @ApiParam({ name: 'id', description: 'Sewage Data ID', type: Number })
  async delete(@Param('id') id: string) {
    return this.sewageDataService.delete(parseInt(id));
  }
}
