import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PlantationDataService } from './plantation-data.service';
import { CreatePlantationDataDto } from './dto/create-plantation-data.dto';
import { UpdatePlantationDataDto } from './dto/update-plantation-data.dto';

@ApiTags('Plantation-Data')
@Controller('plantation-data')
export class PlantationDataController {
  constructor(private plantationDataService: PlantationDataService) {}

  @Get()
  @ApiOperation({ summary: 'List all plantation data' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID', type: Number })
  async findAll(@Query('siteId') siteId?: string) {
    return this.plantationDataService.findAll(siteId ? parseInt(siteId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plantation data by ID' })
  @ApiParam({ name: 'id', description: 'Plantation Data ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.plantationDataService.findOne(parseInt(id));
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get plantation data for a specific site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  async findBySite(@Param('siteId') siteId: string) {
    return this.plantationDataService.findBySite(parseInt(siteId));
  }

  @Post()
  @ApiOperation({ summary: 'Create plantation data for a site' })
  @ApiBody({ type: CreatePlantationDataDto })
  async create(@Body() dto: CreatePlantationDataDto) {
    return this.plantationDataService.create(dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update plantation data for a site' })
  @ApiBody({ type: CreatePlantationDataDto })
  async upsert(@Body() dto: CreatePlantationDataDto) {
    return this.plantationDataService.upsert(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update plantation data' })
  @ApiParam({ name: 'id', description: 'Plantation Data ID', type: Number })
  @ApiBody({ type: UpdatePlantationDataDto })
  async update(@Param('id') id: string, @Body() dto: UpdatePlantationDataDto) {
    return this.plantationDataService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plantation data' })
  @ApiParam({ name: 'id', description: 'Plantation Data ID', type: Number })
  async delete(@Param('id') id: string) {
    return this.plantationDataService.delete(parseInt(id));
  }
}
