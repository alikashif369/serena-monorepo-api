import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PhotosService } from './photos.service';
import { UploadPhotoDto, PhotoCategory } from './dto/upload-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';

@ApiTags('Photos')
@Controller('photos')
export class PhotosController {
  constructor(private photosService: PhotosService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload photo (event, site, or species)' })
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or missing required fields' })
  @ApiResponse({ status: 404, description: 'Site or Species not found' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['category', 'file'],
      properties: {
        category: {
          type: 'string',
          enum: ['EVENT', 'SITE', 'SPECIES', 'COMMUNITY'],
          description: 'Photo category',
        },
        siteId: {
          type: 'integer',
          description: 'Site ID (required for EVENT/SITE/COMMUNITY)',
        },
        speciesId: {
          type: 'integer',
          description: 'Species ID (required for SPECIES)',
        },
        year: {
          type: 'integer',
          description: 'Year (optional, defaults to current year)',
        },
        latitude: {
          type: 'number',
          description: 'Latitude for geotagging',
        },
        longitude: {
          type: 'number',
          description: 'Longitude for geotagging',
        },
        caption: {
          type: 'string',
          description: 'Photo caption',
        },
        description: {
          type: 'string',
          description: 'Detailed description',
        },
        tags: {
          type: 'string',
          description: 'Tags (comma-separated)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Photo file (JPEG/PNG/WEBP)',
        },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPhotoDto,
  ) {
    // TODO: Extract userId from JWT when authentication is enabled
    const userId = undefined; // Will be from JWT token
    return this.photosService.upload(file, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List photos with filters' })
  @ApiQuery({ name: 'siteId', required: false, type: Number, description: 'Filter by site' })
  @ApiQuery({ name: 'speciesId', required: false, type: Number, description: 'Filter by species' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by year' })
  @ApiQuery({ name: 'category', required: false, enum: PhotoCategory, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'List of photos' })
  async findAll(@Query() query: any) {
    return this.photosService.findAll({
      siteId: query.siteId ? parseInt(query.siteId) : undefined,
      speciesId: query.speciesId ? parseInt(query.speciesId) : undefined,
      year: query.year ? parseInt(query.year) : undefined,
      category: query.category,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get photo by ID' })
  @ApiParam({ name: 'id', description: 'Photo ID', type: Number })
  @ApiResponse({ status: 200, description: 'Photo details' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.photosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update photo metadata' })
  @ApiParam({ name: 'id', description: 'Photo ID', type: Number })
  @ApiBody({ type: UpdatePhotoDto })
  @ApiResponse({ status: 200, description: 'Photo updated successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePhotoDto,
  ) {
    return this.photosService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete photo (soft delete)' })
  @ApiParam({ name: 'id', description: 'Photo ID', type: Number })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.photosService.remove(id);
  }
}
