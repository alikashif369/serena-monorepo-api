import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';
import { MinioService } from './common/services/minio.service';
import { UploadRasterDto } from './dto/upload-raster.dto';
import { titilerUrl, maxRasterUploadSizeMB, rasterTileRateLimitPerMinute } from '@shared-config/env';
import sharp from 'sharp';

@Injectable()
export class RasterServiceService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async uploadRaster(file: Express.Multer.File, dto: UploadRasterDto, userId: number) {
    try {
      if (!file?.mimetype?.includes('tiff') && !file?.mimetype?.includes('tif')) {
        throw new BadRequestException('Only GeoTIFF files are supported');
      }

      const maxMb = Number(maxRasterUploadSizeMB);
      const maxSize = maxMb * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException(`File size exceeds ${maxMb}MB limit`);
      }

      let metadata: sharp.Metadata | undefined;
      try {
        metadata = await sharp(file.buffer).metadata();
      } catch (error) {
        console.warn('Failed to extract metadata with sharp:', error.message);
        // allow upload even if metadata extraction fails
      }

      const timestamp = Date.now();
      const safeSite = (dto.siteName ?? 'unknown').replace(/\s+/g, '-').toLowerCase();
      const year = dto.acquisitionDate ? new Date(dto.acquisitionDate).getFullYear() : new Date().getFullYear();
      const category = dto.isClassified ? 'classified' : 'base';
      
      // Hierarchical file key: sites/{slug}/{year}/{filename}
      const fileKey = `sites/${safeSite}/${year}/${safeSite}_${category}_${year}_${timestamp}.tif`;

      console.log('Uploading to MinIO:', { 
        isClassified: dto.isClassified,
        bucket: dto.isClassified ? 'serena-rasters-classified' : 'serena-rasters-base',
        fileKey, 
        size: file.size 
      });

      // Upload to correct bucket based on classification status
      const minioUrl = await this.minio.uploadRaster(
        fileKey, 
        file.buffer, 
        dto.isClassified ?? false,
        {
          'original-name': file.originalname,
          'uploaded-by': String(userId),
          'site-id': String(dto.siteId),
          'year': String(year),
        }
      );

      console.log('MinIO upload successful, URL:', minioUrl);

      const raster = await this.prisma.raster.create({
        data: {
          fileName: file.originalname,
          originalFileName: file.originalname,
          fileSize: BigInt(file.size),
          mimeType: file.mimetype,
          minioUrl,
          minioKey: fileKey,
          width: metadata?.width ?? null,
          height: metadata?.height ?? null,
          bandCount: metadata?.channels ?? 1,
          siteId: dto.siteId,
          siteName: dto.siteName,
          acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : null,
          isClassified: dto.isClassified ?? false,
          classifications: dto.classifications ?? undefined,
          description: dto.description,
          tags: dto.tags ?? [],
          uploadedById: userId,
          bbox: {},
          crs: 'EPSG:4326',
        },
      });

      console.log('Raster saved to database:', raster.id);
      
      // Extract geographic metadata asynchronously (don't block response)
      this.extractCogMetadata(raster.id, minioUrl).catch(err => 
        console.error(`Failed to extract metadata for raster ${raster.id}:`, err)
      );
      
      // Convert BigInt to string for JSON serialization
      return {
        ...raster,
        fileSize: raster.fileSize.toString(),
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async findAll(filters: { siteId?: number; isClassified?: boolean; tags?: string[] }) {
    const rasters = await this.prisma.raster.findMany({
      where: {
        isActive: true,
        ...(filters.siteId !== undefined ? { siteId: filters.siteId } : {}),
        ...(filters.isClassified !== undefined ? { isClassified: filters.isClassified } : {}),
        ...(filters.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
      },
      orderBy: { uploadDate: 'desc' },
    });
    
    return rasters.map(r => ({ ...r, fileSize: r.fileSize.toString() }));
  }

  async findOne(id: number) {
    const raster = await this.prisma.raster.findUnique({ where: { id } });
    if (!raster) throw new NotFoundException(`Raster with ID ${id} not found`);
    return { ...raster, fileSize: raster.fileSize.toString() };
  }

  async getTile(rasterId: number, z: number, x: number, y: number) {
    const raster = await this.findOne(rasterId);
    // Use the permanent MinIO URL stored in database (no expiration)
    const cogUrl = encodeURIComponent(raster.minioUrl);
    const url = `${titilerUrl}/cog/tiles/WebMercatorQuad/${z}/${x}/${y}.png?url=${cogUrl}`;
    console.log(
      `[Tiles] Building TiTiler URL`,
      JSON.stringify({ rasterId, z, x, y, titilerUrl, minioUrl: raster.minioUrl, url })
    );
    return url;
  }

  async remove(id: number) {
    const raster = await this.findOne(id);
    await this.minio.deleteFile(raster.minioKey);
    return this.prisma.raster.update({ where: { id }, data: { isActive: false } });
  }

  /**
   * Extract geographic metadata from COG using TiTiler
   * This populates bbox, crs, width, height, bandCount automatically
   * Runs asynchronously after upload - not blocking user response
   */
  private async extractCogMetadata(rasterId: number, minioUrl: string) {
    try {
      const infoUrl = `${titilerUrl}/cog/info?url=${encodeURIComponent(minioUrl)}`;
      const response = await fetch(infoUrl);
      
      if (!response.ok) {
        console.error(`TiTiler returned ${response.status} for raster ${rasterId}`);
        return;
      }
      
      const info = await response.json();
      
      // Update database with geographic metadata
      await this.prisma.raster.update({
        where: { id: rasterId },
        data: {
          bbox: {
            type: 'Polygon',
            coordinates: [[
              [info.bounds[0], info.bounds[1]], // bottom-left
              [info.bounds[2], info.bounds[1]], // bottom-right
              [info.bounds[2], info.bounds[3]], // top-right
              [info.bounds[0], info.bounds[3]], // top-left
              [info.bounds[0], info.bounds[1]], // close polygon
            ]]
          },
          crs: info.crs || 'EPSG:4326',
          width: info.width,
          height: info.height,
          bandCount: info.count,
        }
      });
      
      console.log(`✅ Extracted metadata for raster ${rasterId}: bounds=${info.bounds}, crs=${info.crs}`);
    } catch (error) {
      console.error(`❌ Failed to extract metadata for raster ${rasterId}:`, error.message);
      // Don't throw - this is optional enhancement, shouldn't fail the upload
    }
  }
}
