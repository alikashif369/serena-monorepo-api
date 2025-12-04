import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { RasterServiceService } from './raster-service.service';
import { UploadRasterDto } from './dto/upload-raster.dto';
import { JwtAuthGuard } from '@shared-config/authentication/guards/jwt-auth.guard';
import { rasterPublicList, rasterPublicDetails, rasterTilesRequireAuth } from '@shared-config/env';
import { Req } from '@nestjs/common';
import type { Request } from 'express';

@ApiTags('Rasters')
@Controller('rasters')
export class RasterServiceController {
  constructor(private readonly rasterService: RasterServiceService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a COG file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        siteName: { type: 'string' },
        siteId: { type: 'number' },
        acquisitionDate: { type: 'string', format: 'date' },
        isClassified: { type: 'boolean' },
        classifications: { type: 'string', example: '{"TreeCanopy":2500,"Water":500}' },
        description: { type: 'string' },
        tags: { type: 'string', example: 'tag1,tag2' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadRasterDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id ?? (req as any).user?.sub ?? 0;
    return await this.rasterService.uploadRaster(file, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rasters with optional filters' })
  async findAll(
    @Query('siteId') siteId?: string,
    @Query('isClassified') isClassified?: string,
    @Query('tags') tags?: string,
  ) {
    // Optionally gate listing behind auth via env flag
    // Note: If strict gating is required, add @UseGuards(JwtAuthGuard) here based on rasterPublicList
    // Keeping public by default as per plan
    return await this.rasterService.findAll({
      siteId: siteId ? Number(siteId) : undefined,
      isClassified: isClassified === 'true',
      tags: tags ? tags.split(',') : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single raster details' })
  async findOne(@Param('id') id: string) {
    return await this.rasterService.findOne(Number(id));
  }

  @Get(':id/tiles/:z/:x/:y.png')
  @ApiOperation({ summary: 'Proxy tile request to TiTiler' })
  async getTile(
    @Param('id') id: string,
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Res() res: Response,
  ) {
    const tileUrl = await this.rasterService.getTile(Number(id), Number(z), Number(x), Number(y));
    console.log('[Tiles] Proxying request to TiTiler', tileUrl);
    try {
      const response = await fetch(tileUrl);
      console.log('[Tiles] TiTiler response', { status: response.status, ok: response.ok });
      if (!response.ok) {
        const text = await response.text();
        console.error('[Tiles] TiTiler error body', text);
        res.status(response.status).send(text);
        return;
      }
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error('[Tiles] Proxy error', err?.message || err);
      res.status(500).send('Tile proxy failed');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a raster' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return await this.rasterService.remove(Number(id));
  }
}
