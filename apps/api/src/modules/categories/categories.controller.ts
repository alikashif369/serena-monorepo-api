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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '@app/shared-config/authentication';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new category (admin only)' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or region not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this slug already exists in this region',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories with optional filters' })
  @ApiQuery({ name: 'regionId', required: false, description: 'Filter by region ID', type: Number })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by category type' })
  async findAll(@Query('regionId') regionId?: string, @Query('type') type?: string) {
    return this.categoriesService.findAll(
      regionId ? parseInt(regionId) : undefined,
      type,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID with region and sites' })
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(parseInt(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or region not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this slug already exists in this region',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(parseInt(id), updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete category (soft delete)' })
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(parseInt(id));
  }

  @Get(':id/sites')
  @ApiOperation({ summary: 'Get all sites in category' })
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  async getSites(@Param('id') id: string) {
    return this.categoriesService.getSites(parseInt(id));
  }
}
