import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpeciesService } from './species.service';
import { CreateSpeciesDto, UpdateSpeciesDto } from './dto/create-species.dto';
import { QuerySpeciesDto } from './dto/query-species.dto';

@ApiTags('Species')
@Controller('species')
export class SpeciesController {
  constructor(private speciesService: SpeciesService) {}

  @Get()
  @ApiOperation({ summary: 'List all species with optional search' })
  async findAll(@Query() query: QuerySpeciesDto) {
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

  @Post('upload-reference-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload species reference image to MinIO' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG/PNG/WEBP, max 50MB)',
        },
      },
    },
  })
  async uploadReferenceImage(@UploadedFile() file: Express.Multer.File) {
    return this.speciesService.uploadReferenceImage(file);
  }
}
