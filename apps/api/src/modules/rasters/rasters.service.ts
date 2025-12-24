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
    // Handle both formats:
    // - Full URL: http://127.0.0.1:9000/bucket-name/path/to/file.tif
    // - Relative path (legacy): /minio/sites/... or /bucket/path/file.tif
    let minioUrl: string;

    if (raster.minioUrl.startsWith('http://') || raster.minioUrl.startsWith('https://')) {
      // Full URL format - extract path and rebuild with configured endpoint
      const urlParts = new URL(raster.minioUrl);
      const pathWithoutLeadingSlash = urlParts.pathname.substring(1); // Remove leading /
      minioUrl = `http://${minioEndpoint}:${minioPort}/${pathWithoutLeadingSlash}`;
    } else {
      // Relative path format (legacy data) - prepend MinIO endpoint
      // Remove leading slash and any /minio prefix if present
      let path = raster.minioUrl;
      if (path.startsWith('/')) path = path.substring(1);
      if (path.startsWith('minio/')) path = path.substring(6);
      minioUrl = `http://${minioEndpoint}:${minioPort}/${path}`;
    }
    
    // Build TiTiler tile URL
    // TiTiler v0.18+ format: /cog/tiles/{TileMatrixSetId}/{z}/{x}/{y}[@{scale}x][.{format}]
    // Use WebMercatorQuad to reproject from any CRS to Web Mercator (EPSG:3857)
    // Parameters:
    // - bidx=1&bidx=2&bidx=3: Select bands 1,2,3 as RGB (many COGs have undefined colorinterp)
    // - rescale=0,255: Scale values to 0-255 range for proper display
    // - minzoom=0&maxzoom=24: Override zoom constraints to allow tiles at any zoom level
    // - resampling_method=bilinear: Better quality when zooming/reprojecting
    // - return_mask=true: Handle nodata values properly (uses band 4 as alpha if present)
    const tileUrl = `${titilerUrl}/cog/tiles/WebMercatorQuad/${z}/${x}/${y}.png?url=${encodeURIComponent(minioUrl)}&bidx=1&bidx=2&bidx=3&rescale=0,255&minzoom=0&maxzoom=24&resampling_method=bilinear&return_mask=true`;
    
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
          // Extract bucket and key from either full URL or relative path
          let pathParts: string[];
          if (raster.minioUrl.startsWith('http://') || raster.minioUrl.startsWith('https://')) {
            const srcUrl = new URL(raster.minioUrl);
            pathParts = srcUrl.pathname.split('/').filter(Boolean);
          } else {
            // Relative path - remove leading slash and /minio prefix
            let path = raster.minioUrl;
            if (path.startsWith('/')) path = path.substring(1);
            if (path.startsWith('minio/')) path = path.substring(6);
            pathParts = path.split('/').filter(Boolean);
          }
          const bucket = pathParts[0];
          const key = pathParts.slice(1).join('/');

          // Generate presigned URL valid for 1 hour
          const presigned = await this.minio.getPresignedUrl(bucket, key, 3600);
          const tileUrl2 = `${titilerUrl}/cog/tiles/WebMercatorQuad/${z}/${x}/${y}.png?url=${encodeURIComponent(presigned)}&bidx=1&bidx=2&bidx=3&rescale=0,255&minzoom=0&maxzoom=24&resampling_method=bilinear&return_mask=true`;
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

  async refreshMetadata(id: number) {
    const raster = await this.prisma.raster.findUnique({
      where: { id },
    });

    if (!raster) {
      throw new NotFoundException(`Raster with ID ${id} not found`);
    }

    // Build MinIO URL for TiTiler
    // Handle both full URL and relative path formats
    let minioUrl: string;
    if (raster.minioUrl.startsWith('http://') || raster.minioUrl.startsWith('https://')) {
      const urlParts = new URL(raster.minioUrl);
      const pathWithoutLeadingSlash = urlParts.pathname.substring(1);
      minioUrl = `http://${minioEndpoint}:${minioPort}/${pathWithoutLeadingSlash}`;
    } else {
      let path = raster.minioUrl;
      if (path.startsWith('/')) path = path.substring(1);
      if (path.startsWith('minio/')) path = path.substring(6);
      minioUrl = `http://${minioEndpoint}:${minioPort}/${path}`;
    }

    try {
      // Fetch metadata from TiTiler's info endpoint
      const infoUrl = `${titilerUrl}/cog/info?url=${encodeURIComponent(minioUrl)}`;
      console.log('Fetching metadata from TiTiler:', infoUrl);

      const response = await fetch(infoUrl);

      if (!response.ok) {
        throw new NotFoundException(`TiTiler could not access the raster file: ${response.statusText}`);
      }

      const info = await response.json();
      console.log('TiTiler metadata:', info);

      // Fetch bounds in Web Mercator projection
      const boundsUrl = `${titilerUrl}/cog/WebMercatorQuad/tilejson.json?url=${encodeURIComponent(minioUrl)}`;
      const boundsResponse = await fetch(boundsUrl);

      if (!boundsResponse.ok) {
        throw new NotFoundException(`TiTiler could not generate bounds: ${boundsResponse.statusText}`);
      }

      const tileJson = await boundsResponse.json();
      const bounds = tileJson.bounds; // [minLon, minLat, maxLon, maxLat] in WGS84
      const center = tileJson.center; // [lon, lat, zoom] from TiTiler

      // Update raster record with metadata
      const updatedRaster = await this.prisma.raster.update({
        where: { id },
        data: {
          width: info.width || null,
          height: info.height || null,
          bandCount: info.count || null,
          crs: info.crs ? info.crs.replace('http://www.opengis.net/def/crs/EPSG/0/', 'EPSG:') : null,
          bbox: bounds ? {
            type: 'Polygon',
            coordinates: [[
              [bounds[0], bounds[1]], // minLon, minLat
              [bounds[2], bounds[1]], // maxLon, minLat
              [bounds[2], bounds[3]], // maxLon, maxLat
              [bounds[0], bounds[3]], // minLon, maxLat
              [bounds[0], bounds[1]], // close polygon
            ]]
          } as any : Prisma.JsonNull,
          center: center ? {
            lon: center[0],
            lat: center[1],
            zoom: center[2]
          } as any : Prisma.JsonNull,
        },
      });

      return {
        ...updatedRaster,
        fileSize: updatedRaster.fileSize.toString(),
        message: 'Metadata refreshed successfully',
      };
    } catch (error) {
      console.error('Failed to refresh metadata:', error);
      throw new NotFoundException(`Failed to refresh metadata: ${error.message}`);
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
