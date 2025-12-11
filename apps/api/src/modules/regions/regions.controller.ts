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
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { JwtAuthGuard } from '@app/shared-config/authentication';

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private regionsService: RegionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new region (admin only)' })
  @ApiBody({ type: CreateRegionDto })
  @ApiResponse({
    status: 201,
    description: 'Region created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or organization not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Region with this slug already exists in this organization',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all regions with optional organization filter' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization ID', type: Number })
  async findAll(@Query('organizationId') organizationId?: string) {
    return this.regionsService.findAll(
      organizationId ? parseInt(organizationId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get region by ID with organization' })
  @ApiParam({ name: 'id', description: 'Region ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.regionsService.findOne(parseInt(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update region' })
  @ApiParam({ name: 'id', description: 'Region ID', type: Number })
  @ApiBody({ type: UpdateRegionDto })
  @ApiResponse({
    status: 200,
    description: 'Region updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Region not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or organization not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Region with this slug already exists in this organization',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(parseInt(id), updateRegionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete region (soft delete)' })
  @ApiParam({ name: 'id', description: 'Region ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Region deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Region not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async remove(@Param('id') id: string) {
    return this.regionsService.remove(parseInt(id));
  }

  @Get(':id/categories')
  @ApiOperation({ summary: 'Get categories in region' })
  @ApiParam({ name: 'id', description: 'Region ID', type: Number })
  async getCategories(@Param('id') id: string) {
    return this.regionsService.getCategories(parseInt(id));
  }
}
