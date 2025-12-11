import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../../common/services/minio.service';
import { Prisma } from '@prisma/client';
import * as path from 'path';
import { fromArrayBuffer } from 'geotiff';
import { titilerUrl, minioEndpoint, minioPort } from '@shared-config/env';

@Injectable()
export class RastersService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async upload(
    file: Express.Multer.File,
    siteId: number,
    year: number,
    isClassified: boolean,
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedExtensions = ['.tif', '.tiff', '.geotiff'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('Only GeoTIFF files are allowed');
    }

    // Verify site exists
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    // Generate MinIO path
    const timestamp = Date.now();
    const fileName = `${site.slug}_${year}_${isClassified ? 'classified' : 'base'}_${timestamp}${fileExtension}`;
    const minioKey = `sites/${site.slug}/${year}/${fileName}`;

    console.log('Uploading to MinIO:', { 
      isClassified, 
      fileKey: minioKey, 
      size: file.size 
    });

    let minioUrl: string;
    let raster: any;

    try {
      // Upload to MinIO with correct bucket routing
      minioUrl = await this.minio.uploadRaster(
        minioKey, 
        file.buffer, 
        isClassified,
        {
          'original-name': file.originalname,
          'site-id': String(siteId),
          'year': String(year),
        }
      );

      console.log('MinIO upload successful:', minioUrl);

      // Extract metadata from GeoTIFF
      let metadata: { width?: number; height?: number; bandCount?: number; bbox?: number[] } = {};
      try {
        // Convert Buffer to ArrayBuffer (geotiff expects pure ArrayBuffer)
        const arrayBuffer = file.buffer.buffer.slice(
          file.buffer.byteOffset,
          file.buffer.byteOffset + file.buffer.byteLength
        ) as ArrayBuffer;
        
        const tiff = await fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        
        metadata = {
          width: image.getWidth(),
          height: image.getHeight(),
          bandCount: image.getSamplesPerPixel(),
        };
        
        // Extract bounding box if available
        const bbox = image.getBoundingBox();
        if (bbox) {
          metadata.bbox = bbox; // [minX, minY, maxX, maxY]
        }
        
        console.log('Extracted GeoTIFF metadata:', metadata);
      } catch (metadataError) {
        console.warn('Failed to extract GeoTIFF metadata:', metadataError.message);
        // Continue with null metadata - can be extracted later via background job
      }

      // Create Raster record only after successful MinIO upload
      raster = await this.prisma.raster.create({
        data: {
          siteId,
          year,
          fileName,
          originalFileName: file.originalname,
          fileSize: BigInt(file.size),
          mimeType: file.mimetype,
          minioKey,
          minioUrl,
          isClassified,
          crs: 'EPSG:4326',
          width: metadata.width ?? null,
          height: metadata.height ?? null,
          bandCount: metadata.bandCount ?? null,
          bbox: metadata.bbox ? {
            type: 'Polygon',
            coordinates: [[
              [metadata.bbox[0], metadata.bbox[1]], // minX, minY
              [metadata.bbox[2], metadata.bbox[1]], // maxX, minY
              [metadata.bbox[2], metadata.bbox[3]], // maxX, maxY
              [metadata.bbox[0], metadata.bbox[3]], // minX, maxY
              [metadata.bbox[0], metadata.bbox[1]], // close polygon
            ]]
          } as any : Prisma.JsonNull,
        },
      });
    } catch (error) {
      console.error('Upload failed:', error);
      // If database record was created but MinIO upload failed, clean up
      if (raster?.id) {
        await this.prisma.raster.delete({ where: { id: raster.id } }).catch(() => {});
      }
      throw error;
    }

    // Link to YearlyMetrics
    const yearlyMetrics = await this.prisma.yearlyMetrics.findFirst({
      where: { siteId, year },
    });

    if (yearlyMetrics) {
      await this.prisma.yearlyMetrics.update({
        where: { id: yearlyMetrics.id },
        data: isClassified
          ? { classifiedRasterId: raster.id }
          : { baseRasterId: raster.id },
      });
    } else {
      // Create new YearlyMetrics record
      await this.prisma.yearlyMetrics.create({
        data: {
          siteId,
          year,
          ...(isClassified
            ? { classifiedRasterId: raster.id }
            : { baseRasterId: raster.id }),
        },
      });
    }

    return {
      ...raster,
      fileSize: raster.fileSize.toString(), // Convert BigInt to string for JSON serialization
    };
  }

  async findAll(query?: any) {
    const where: any = {};

    if (query?.siteId) where.siteId = parseInt(query.siteId);
    if (query?.year) where.year = parseInt(query.year);
    if (query?.isClassified !== undefined) {
      where.isClassified = query.isClassified === 'true';
    }

    const rasters = await this.prisma.raster.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [{ siteId: 'asc' }, { year: 'desc' }, { createdAt: 'desc' }],
    });

    // Convert BigInt to string for JSON serialization
    return rasters.map(raster => ({
      ...raster,
      fileSize: raster.fileSize.toString(),
    }));
  }

  async findOne(id: number) {
    const raster = await this.prisma.raster.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                region: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!raster) {
      throw new NotFoundException(`Raster with ID ${id} not found`);
    }

    return {
      ...raster,
      fileSize: raster.fileSize.toString(), // Convert BigInt to string for JSON serialization
    };
  }

  async getTiles(id: number, z: number, x: number, y: number) {
    console.log('🎬 getTiles CALLED with:', { id, z, x, y });
    
    const raster = await this.prisma.raster.findUnique({
      where: { id },
    });

    if (!raster) {
      console.log('❌ Raster not found:', id);
      throw new NotFoundException(`Raster with ID ${id} not found`);
    }
    
    console.log('✅ Found raster:', { id: raster.id, minioUrl: raster.minioUrl });

    // Build MinIO URL that TiTiler can access
    // raster.minioUrl format: http://127.0.0.1:9000/bucket-name/path/to/file.tif
    // Extract just the bucket and key path from the full URL
    const urlParts = new URL(raster.minioUrl);
    const pathWithoutLeadingSlash = urlParts.pathname.substring(1); // Remove leading /
    const minioUrl = `http://${minioEndpoint}:${minioPort}/${pathWithoutLeadingSlash}`;
    
    // Build TiTiler tile URL
    // TiTiler v0.18+ format: /cog/tiles/{TileMatrixSetId}/{z}/{x}/{y}[@{scale}x][.{format}]
    // Use WebMercatorQuad to reproject from any CRS to Web Mercator (EPSG:3857)
    const tileUrl = `${titilerUrl}/cog/tiles/WebMercatorQuad/${z}/${x}/${y}.png?url=${encodeURIComponent(minioUrl)}`;
    
    console.log('🗺️ Tile request:', { rasterId: id, z, x, y });
    console.log('📍 MinIO URL:', minioUrl);
    console.log('🎨 TiTiler URL:', tileUrl);
    
    try {
      // Fetch tile from TiTiler
      console.log('🚀 Fetching from TiTiler...');
      const response = await fetch(tileUrl);
      console.log(`📥 TiTiler response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // If TiTiler couldn't fetch the file directly from MinIO, try with a presigned URL
        const errorText = await response.text();
        console.warn('❌ TiTiler initial error response:', response.status, errorText);

        try {
          const srcUrl = new URL(raster.minioUrl);
          const parts = srcUrl.pathname.split('/').filter(Boolean);
          const bucket = parts[0];
          const key = parts.slice(1).join('/');

          // Generate presigned URL valid for 1 hour
          const presigned = await this.minio.getPresignedUrl(bucket, key, 3600);
          const tileUrl2 = `${titilerUrl}/cog/tiles/WebMercatorQuad/${z}/${x}/${y}.png?url=${encodeURIComponent(presigned)}`;
          console.log('🔁 Retrying TiTiler with presigned URL', tileUrl2);

          const resp2 = await fetch(tileUrl2);
          if (!resp2.ok) {
            const err2 = await resp2.text();
            console.error('❌ TiTiler error response (presigned):', err2);
            throw new Error(`TiTiler returned ${resp2.status}: ${resp2.statusText}`);
          }

          const imageBuffer2 = await resp2.arrayBuffer();
          return {
            buffer: Buffer.from(imageBuffer2),
            contentType: resp2.headers.get('content-type') || 'image/png',
          };
        } catch (presignError) {
          console.error('Presigned retry failed:', presignError);
          throw new Error(`TiTiler returned ${response.status}: ${response.statusText}`);
        }
      }

      console.log('✅ Tile fetched successfully');

      // Return the tile image buffer
      const imageBuffer = await response.arrayBuffer();

      return {
        buffer: Buffer.from(imageBuffer),
        contentType: response.headers.get('content-type') || 'image/png',
      };
    } catch (error) {
      console.error('TiTiler tile fetch error:', error);
      throw new NotFoundException(
        `Failed to fetch tile: ${error.message}. Ensure TiTiler is running at ${titilerUrl} and can access MinIO at ${minioUrl}`
      );
    }
  }

  async delete(id: number) {
    const raster = await this.prisma.raster.findUnique({
      where: { id },
    });

    if (!raster) {
      throw new NotFoundException(`Raster with ID ${id} not found`);
    }

    // TODO: Delete from MinIO
    // const minioClient = new MinioClient(...);
    // await minioClient.removeObject(bucket, raster.minioKey);

    await this.prisma.raster.delete({
      where: { id },
    });

    return { message: `Raster ${id} deleted successfully` };
  }
}
