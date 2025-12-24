import { Controller, Post, Get, Delete, Param, Query, UploadedFile, UseInterceptors, StreamableFile, Header } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RastersService } from './rasters.service';

@ApiTags('Rasters')
@Controller('rasters')
export class RastersController {
  constructor(private rastersService: RastersService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload GeoTIFF raster file' })
  @ApiQuery({ name: 'siteId', required: true, description: 'Site ID', type: Number })
  @ApiQuery({ name: 'year', required: true, description: 'Year', type: Number })
  @ApiQuery({ name: 'isClassified', required: true, description: 'Is classified raster', type: Boolean })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'GeoTIFF file (.tif, .tiff, .geotiff)',
        },
      },
    },
  })
  async upload(@UploadedFile() file: Express.Multer.File, @Query() query: any) {
    const { siteId, year, isClassified } = query;
    return this.rastersService.upload(
      file,
      parseInt(siteId),
      parseInt(year),
      isClassified === 'true',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List rasters with filters' })
  @ApiQuery({ name: 'siteId', required: false, description: 'Filter by site ID' })
  @ApiQuery({ name: 'year', required: false, description: 'Filter by year' })
  @ApiQuery({ name: 'isClassified', required: false, description: 'Filter by classification' })
  async findAll(@Query() query: any) {
    return this.rastersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get raster metadata' })
  @ApiParam({ name: 'id', description: 'Raster ID', type: Number })
  async findOne(@Param('id') id: string) {
    return this.rastersService.findOne(parseInt(id));
  }

  @Get(':id/tiles/:z/:x/:y.png')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Get raster tiles (TMS format) via TiTiler' })
  @ApiParam({ name: 'id', description: 'Raster ID', type: Number })
  @ApiParam({ name: 'z', description: 'Zoom level', type: Number })
  @ApiParam({ name: 'x', description: 'Tile X', type: Number })
  @ApiParam({ name: 'y', description: 'Tile Y', type: Number })
  @ApiResponse({ status: 200, description: 'Returns PNG tile image', content: { 'image/png': {} } })
  @ApiResponse({ status: 404, description: 'Raster not found or tile generation failed' })
  async getTiles(
    @Param('id') id: string,
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
  ): Promise<StreamableFile> {
    console.log('🎯 Controller getTiles called:', { id, z, x, y });
    const tile = await this.rastersService.getTiles(parseInt(id), parseInt(z), parseInt(x), parseInt(y));
    console.log('🎨 Tile received from service, creating StreamableFile');
    return new StreamableFile(tile.buffer, {
      type: tile.contentType,
    });
  }

  @Post(':id/refresh-metadata')
  @ApiOperation({ summary: 'Refresh raster metadata from TiTiler' })
  @ApiParam({ name: 'id', description: 'Raster ID', type: Number })
  @ApiResponse({ status: 200, description: 'Metadata refreshed successfully' })
  @ApiResponse({ status: 404, description: 'Raster not found' })
  async refreshMetadata(@Param('id') id: string) {
    return this.rastersService.refreshMetadata(parseInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete raster' })
  @ApiParam({ name: 'id', description: 'Raster ID', type: Number })
  async delete(@Param('id') id: string) {
    return this.rastersService.delete(parseInt(id));
  }
}
