import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SolarDataService } from './solar-data.service';
import { CreateSolarDataDto } from './dto/create-solar-data.dto';
import { UpdateSolarDataDto } from './dto/update-solar-data.dto';

@ApiTags('Solar-Data')
@Controller('solar-data')
export class SolarDataController {
  constructor(private solarDataService: SolarDataService) {}

  @Get()
  @ApiOperation({ summary: 'List all solar data' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID', type: Number })
  async findAll(@Query('siteId') siteId?: string) {
    return this.solarDataService.findAll(siteId ? parseInt(siteId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get solar data by ID' })
  @ApiParam({ name: 'id', description: 'Solar Data ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.solarDataService.findOne(parseInt(id));
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get solar data for a specific site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  async findBySite(@Param('siteId') siteId: string) {
    return this.solarDataService.findBySite(parseInt(siteId));
  }

  @Post()
  @ApiOperation({ summary: 'Create solar data for a site' })
  @ApiBody({ type: CreateSolarDataDto })
  async create(@Body() dto: CreateSolarDataDto) {
    return this.solarDataService.create(dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update solar data for a site' })
  @ApiBody({ type: CreateSolarDataDto })
  async upsert(@Body() dto: CreateSolarDataDto) {
    return this.solarDataService.upsert(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update solar data' })
  @ApiParam({ name: 'id', description: 'Solar Data ID', type: Number })
  @ApiBody({ type: UpdateSolarDataDto })
  async update(@Param('id') id: string, @Body() dto: UpdateSolarDataDto) {
    return this.solarDataService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete solar data' })
  @ApiParam({ name: 'id', description: 'Solar Data ID', type: Number })
  async delete(@Param('id') id: string) {
    return this.solarDataService.delete(parseInt(id));
  }
}
