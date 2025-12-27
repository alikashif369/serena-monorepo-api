import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SpeciesService } from './species.service';
import { CreateSpeciesDto, UpdateSpeciesDto } from './dto/create-species.dto';

@ApiTags('Species')
@Controller('species')
export class SpeciesController {
  constructor(private speciesService: SpeciesService) {}

  @Get()
  @ApiOperation({ summary: 'List all species with optional search' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by code, botanical name, or local name' })
  async findAll(@Query() query: any) {
    return this.speciesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get species by id' })
  @ApiParam({ name: 'id', description: 'Species ID' })
  async findOne(@Param('id') id: string) {
    return this.speciesService.findOne(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create new species' })
  @ApiBody({ type: CreateSpeciesDto })
  async create(@Body() body: CreateSpeciesDto) {
    return this.speciesService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update species' })
  @ApiParam({ name: 'id', description: 'Species ID' })
  @ApiBody({ type: UpdateSpeciesDto })
  async update(@Param('id') id: string, @Body() body: UpdateSpeciesDto) {
    return this.speciesService.update(parseInt(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete species' })
  @ApiParam({ name: 'id', description: 'Species ID' })
  async delete(@Param('id') id: string) {
    return this.speciesService.delete(parseInt(id));
  }
}
