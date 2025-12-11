import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '@app/shared-config/authentication';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new organization (super admin only)' })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 409,
    description: 'Organization with this slug already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID with regions' })
  @ApiParam({ name: 'id', description: 'Organization ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(parseInt(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update organization' })
  @ApiParam({ name: 'id', description: 'Organization ID', type: Number })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Organization with this slug already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(
      parseInt(id),
      updateOrganizationDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete organization (soft delete)' })
  @ApiParam({ name: 'id', description: 'Organization ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async remove(@Param('id') id: string) {
    return this.organizationsService.remove(parseInt(id));
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get full organization hierarchy (all regions, categories, sites)' })
  @ApiParam({ name: 'id', description: 'Organization ID', type: Number })
  async getHierarchy(@Param('id') id: string) {
    return this.organizationsService.getHierarchy(parseInt(id));
  }

  @Get(':id/regions')
  @ApiOperation({ summary: 'Get regions in organization' })
  @ApiParam({ name: 'id', description: 'Organization ID', type: Number })
  async getRegions(@Param('id') id: string) {
    return this.organizationsService.getRegions(parseInt(id));
  }
}
