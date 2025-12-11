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
import { SubCategoriesService } from './sub-categories.service';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { JwtAuthGuard } from '@app/shared-config/authentication';

@ApiTags('SubCategories')
@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private subCategoriesService: SubCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create new subcategory (admin only)' })
  @ApiBody({ type: CreateSubCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'SubCategory created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'SubCategory with this slug already exists in this category',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    return this.subCategoriesService.create(createSubCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all sub-categories' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID', type: Number })
  async findAll(@Query('categoryId') categoryId?: string) {
    return this.subCategoriesService.findAll(
      categoryId ? parseInt(categoryId) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sub-category by ID' })
  @ApiParam({ name: 'id', description: 'SubCategory ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.subCategoriesService.findOne(parseInt(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update subcategory' })
  @ApiParam({ name: 'id', description: 'SubCategory ID', type: Number })
  @ApiBody({ type: UpdateSubCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'SubCategory updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'SubCategory not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'SubCategory with this slug already exists in this category',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async update(@Param('id') id: string, @Body() updateSubCategoryDto: UpdateSubCategoryDto) {
    return this.subCategoriesService.update(parseInt(id), updateSubCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete subcategory (soft delete)' })
  @ApiParam({ name: 'id', description: 'SubCategory ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'SubCategory deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'SubCategory not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async remove(@Param('id') id: string) {
    return this.subCategoriesService.remove(parseInt(id));
  }
}
