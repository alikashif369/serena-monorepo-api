import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { WasteDataService } from './waste-data.service';
import { CreateWasteDataDto } from './dto/create-waste-data.dto';
import { UpdateWasteDataDto } from './dto/update-waste-data.dto';

@ApiTags('Waste-Data')
@Controller('waste-data')
export class WasteDataController {
  constructor(private wasteDataService: WasteDataService) {}

  @Get()
  @ApiOperation({ summary: 'List all waste data' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID', type: Number })
  @ApiQuery({ name: 'year', required: false, description: 'Filter by year', type: Number })
  async findAll(@Query('siteId') siteId?: string, @Query('year') year?: string) {
    return this.wasteDataService.findAll({
      siteId: siteId ? parseInt(siteId) : undefined,
      year: year ? parseInt(year) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get waste data by ID' })
  @ApiParam({ name: 'id', description: 'Waste Data ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.wasteDataService.findOne(parseInt(id));
  }

  @Get('site/:siteId/year/:year')
  @ApiOperation({ summary: 'Get waste data for a specific site and year' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  @ApiParam({ name: 'year', description: 'Year', type: Number })
  async findBySiteAndYear(@Param('siteId') siteId: string, @Param('year') year: string) {
    return this.wasteDataService.findBySiteAndYear(parseInt(siteId), parseInt(year));
  }

  @Post()
  @ApiOperation({ summary: 'Create waste data for a site' })
  @ApiBody({ type: CreateWasteDataDto })
  async create(@Body() dto: CreateWasteDataDto) {
    return this.wasteDataService.create(dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update waste data for a site and year' })
  @ApiBody({ type: CreateWasteDataDto })
  async upsert(@Body() dto: CreateWasteDataDto) {
    return this.wasteDataService.upsert(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update waste data' })
  @ApiParam({ name: 'id', description: 'Waste Data ID', type: Number })
  @ApiBody({ type: UpdateWasteDataDto })
  async update(@Param('id') id: string, @Body() dto: UpdateWasteDataDto) {
    return this.wasteDataService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete waste data' })
  @ApiParam({ name: 'id', description: 'Waste Data ID', type: Number })
  async delete(@Param('id') id: string) {
    return this.wasteDataService.delete(parseInt(id));
  }
}
