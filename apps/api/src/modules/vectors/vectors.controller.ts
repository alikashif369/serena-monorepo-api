import { Controller, Post, Get, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VectorsService } from './vectors.service';
import { CreateBoundaryDto, UpdateBoundaryDto } from './dto/create-boundary.dto';

@ApiTags('Vectors')
@Controller('vectors')
export class VectorsController {
  constructor(private vectorsService: VectorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create site boundary' })
  @ApiBody({
    type: CreateBoundaryDto,
    description: 'Boundary data with GeoJSON geometry',
  })
  async create(@Body() body: CreateBoundaryDto) {
    const { siteId, year, geometry, properties } = body;
    return this.vectorsService.create(siteId, year, geometry, properties);
  }

  @Get()
  @ApiOperation({ summary: 'List boundaries with filters' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID' })
  @ApiQuery({ name: 'year', required: false, description: 'Filter by year' })
  @ApiQuery({ name: 'minYear', required: false, description: 'Minimum year' })
  @ApiQuery({ name: 'maxYear', required: false, description: 'Maximum year' })
  async findAll(@Query() query: any) {
    return this.vectorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get boundary by ID' })
  @ApiParam({ name: 'id', description: 'Boundary ID' })
  async findOne(@Param('id') id: string) {
    return this.vectorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update boundary' })
  @ApiParam({ name: 'id', description: 'Boundary ID' })
  @ApiBody({ type: UpdateBoundaryDto })
  async update(@Param('id') id: string, @Body() body: UpdateBoundaryDto) {
    return this.vectorsService.update(id, body.geometry, body.properties);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete boundary' })
  @ApiParam({ name: 'id', description: 'Boundary ID' })
  async delete(@Param('id') id: string) {
    return this.vectorsService.delete(id);
  }

  @Get(':id/properties')
  @ApiOperation({ summary: 'Get boundary properties' })
  @ApiParam({ name: 'id', description: 'Boundary ID' })
  async getProperties(@Param('id') id: string) {
    return this.vectorsService.findOne(id);
  }
}
