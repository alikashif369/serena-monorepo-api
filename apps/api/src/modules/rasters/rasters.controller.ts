import { Controller, Post, Get, Delete, Param, Query, UploadedFile, UseInterceptors, Res, Headers, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@app/shared-config/authentication';
import type { Response } from 'express';
import { RastersService } from './rasters.service';
import { DiskTileCacheService, CacheStats } from '../tile-cache/disk-tile-cache.service';

@ApiTags('Rasters')
@Controller('rasters')
export class RastersController {
  constructor(
    private rastersService: RastersService,
    private tileCacheService: DiskTileCacheService,
  ) {}

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
  @SkipThrottle()
  @ApiOperation({ summary: 'Get raster tiles (TMS format) via TiTiler with disk caching' })
  @ApiParam({ name: 'id', description: 'Raster ID', type: Number })
  @ApiParam({ name: 'z', description: 'Zoom level', type: Number })
  @ApiParam({ name: 'x', description: 'Tile X', type: Number })
  @ApiParam({ name: 'y', description: 'Tile Y', type: Number })
  @ApiResponse({ status: 200, description: 'Returns PNG tile image', content: { 'image/png': {} } })
  @ApiResponse({ status: 304, description: 'Not modified (ETag match)' })
  @ApiResponse({ status: 404, description: 'Raster not found or tile generation failed' })
  async getTiles(
    @Param('id') id: string,
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Headers('if-none-match') ifNoneMatch: string,
    @Res() res: Response,
  ): Promise<void> {
    const rasterId = parseInt(id);
    const zoomLevel = parseInt(z);
    const tileX = parseInt(x);
    const tileY = parseInt(y);

    // Get TTL for this zoom level
    const ttlSeconds = this.tileCacheService.getTTLSeconds(zoomLevel);

    // Try to get from cache first
    const cachedTile = await this.tileCacheService.get(rasterId, zoomLevel, tileX, tileY);

    if (cachedTile) {
      // Generate ETag for cached tile
      const etag = `"${rasterId}-${zoomLevel}-${tileX}-${tileY}-cached"`;

      // Check if client has this version
      if (ifNoneMatch === etag) {
        res.status(304).end();
        return;
      }

      // Return cached tile with headers
      this.setCacheHeaders(res, ttlSeconds, etag, true);
      res.type('image/png').send(cachedTile);
      return;
    }

    // Cache miss - fetch from TiTiler via service
    console.log(`[TileCache] MISS: raster=${rasterId} z=${zoomLevel} x=${tileX} y=${tileY}`);

    const tile = await this.rastersService.getTiles(rasterId, zoomLevel, tileX, tileY);

    // Save to cache (async, don't wait)
    this.tileCacheService.set(rasterId, zoomLevel, tileX, tileY, tile.buffer).catch(err =>
      console.warn('[TileCache] Failed to cache tile:', err.message)
    );

    // Generate ETag for fresh tile
    const etag = `"${rasterId}-${zoomLevel}-${tileX}-${tileY}-${Date.now()}"`;

    // Return tile with headers
    this.setCacheHeaders(res, ttlSeconds, etag, false);
    res.type(tile.contentType).send(tile.buffer);
  }

  /**
   * Set cache-related HTTP headers
   */
  private setCacheHeaders(res: Response, ttlSeconds: number, etag: string, cacheHit: boolean): void {
    res.set({
      'Cache-Control': `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`,
      'ETag': etag,
      'X-Cache-Status': cacheHit ? 'HIT' : 'MISS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'X-Cache-Status, ETag',
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

  @Get('cache/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tile cache statistics (requires auth)' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCacheStats(): Promise<CacheStats> {
    return this.tileCacheService.getStats();
  }

  @Post('cache/clear/:rasterId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear tile cache for a specific raster (requires auth)' })
  @ApiParam({ name: 'rasterId', description: 'Raster ID', type: Number })
  @ApiResponse({ status: 200, description: 'Cache cleared for raster' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearRasterCache(@Param('rasterId') rasterId: string) {
    await this.tileCacheService.invalidateRaster(parseInt(rasterId));
    return { message: `Cache cleared for raster ${rasterId}` };
  }

  @Post('cache/clear-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear entire tile cache (requires auth)' })
  @ApiResponse({ status: 200, description: 'All cache cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearAllCache() {
    await this.tileCacheService.invalidateAll();
    return { message: 'All tile cache cleared' };
  }
}
