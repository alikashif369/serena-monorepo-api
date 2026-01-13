import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CommunityDataService } from './community-data.service';
import { CreateCommunityDataDto } from './dto/create-community-data.dto';
import { UpdateCommunityDataDto } from './dto/update-community-data.dto';

@ApiTags('Community-Data')
@Controller('community-data')
export class CommunityDataController {
  constructor(private communityDataService: CommunityDataService) {}

  @Get()
  @ApiOperation({ summary: 'List all community data' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID', type: Number })
  async findAll(@Query('siteId') siteId?: string) {
    return this.communityDataService.findAll(siteId ? parseInt(siteId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get community data by ID' })
  @ApiParam({ name: 'id', description: 'Community Data ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.communityDataService.findOne(parseInt(id));
  }

  @Get('site/:siteId')
  @ApiOperation({ summary: 'Get community data for a specific site' })
  @ApiParam({ name: 'siteId', description: 'Site ID', type: Number })
  async findBySite(@Param('siteId') siteId: string) {
    return this.communityDataService.findBySite(parseInt(siteId));
  }

  @Post()
  @ApiOperation({ summary: 'Create community data for a site' })
  @ApiBody({ type: CreateCommunityDataDto })
  async create(@Body() dto: CreateCommunityDataDto) {
    return this.communityDataService.create(dto);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update community data for a site' })
  @ApiBody({ type: CreateCommunityDataDto })
  async upsert(@Body() dto: CreateCommunityDataDto) {
    return this.communityDataService.upsert(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update community data' })
  @ApiParam({ name: 'id', description: 'Community Data ID', type: Number })
  @ApiBody({ type: UpdateCommunityDataDto })
  async update(@Param('id') id: string, @Body() dto: UpdateCommunityDataDto) {
    return this.communityDataService.update(parseInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete community data' })
  @ApiParam({ name: 'id', description: 'Community Data ID', type: Number })
  async delete(@Param('id') id: string) {
    return this.communityDataService.delete(parseInt(id));
  }
}
