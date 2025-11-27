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
      const safeSite = (dto.siteName ?? 'unknown').replace(/\s+/g, '_');
      const fileKey = `${safeSite}_${timestamp}_${file.originalname}`;

      console.log('Uploading to MinIO:', { bucket: 'serena-rasters', fileKey, size: file.size });

      const minioUrl = await this.minio.uploadFile(fileKey, file.buffer, {
        'original-name': file.originalname,
        'uploaded-by': String(userId),
      });

      console.log('MinIO upload successful, presigned URL:', minioUrl);

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
    const cogUrl = encodeURIComponent(raster.minioUrl);
    return `${titilerUrl}/cog/tiles/${z}/${x}/${y}.png?url=${cogUrl}`;
  }

  async remove(id: number) {
    const raster = await this.findOne(id);
    await this.minio.deleteFile(raster.minioKey);
    return this.prisma.raster.update({ where: { id }, data: { isActive: false } });
  }
}
