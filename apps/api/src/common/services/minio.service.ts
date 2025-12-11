import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { 
  minioEndpoint, 
  minioPort, 
  minioAccessKey, 
  minioSecretKey, 
  minioUseSSL,
  minioBucketRastersBase,
  minioBucketRastersClassified,
  minioBucketPhotos
} from '@shared-config/env';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  public readonly buckets = {
    rastersBase: minioBucketRastersBase,
    rastersClassified: minioBucketRastersClassified,
    photos: minioBucketPhotos,
  };

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: minioEndpoint,
      port: parseInt(minioPort, 10),
      useSSL: minioUseSSL,
      accessKey: minioAccessKey,
      secretKey: minioSecretKey,
    });
  }

  async onModuleInit() {
    // Create all buckets if they don't exist
    for (const bucket of Object.values(this.buckets)) {
      if (!bucket) continue;
      try {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket, 'us-east-1');
          console.log(`✅ Created MinIO bucket: ${bucket}`);
        } else {
          console.log(`✓ MinIO bucket exists: ${bucket}`);
        }
      } catch (error) {
        console.error(`❌ Error checking/creating bucket ${bucket}:`, error.message);
      }
    }
    
    // Set public-read policy for public buckets (needed for TiTiler access)
    await this.setPublicPolicy(this.buckets.photos);
    await this.setPublicPolicy(this.buckets.rastersBase);
    await this.setPublicPolicy(this.buckets.rastersClassified);
  }

  /**
   * Upload raster file to appropriate bucket based on classification status
   */
  async uploadRaster(
    fileKey: string, 
    buffer: Buffer, 
    isClassified: boolean, 
    metadata?: Record<string, string>
  ): Promise<string> {
    const bucket = isClassified ? this.buckets.rastersClassified : this.buckets.rastersBase;
    await this.minioClient.putObject(bucket, fileKey, buffer, buffer.length, {
      'Content-Type': 'image/tiff',
      ...(metadata ?? {}),
    });
    return this.getPermanentUrl(bucket, fileKey);
  }

  /**
   * Upload photo file to photos bucket
   */
  async uploadPhoto(
    fileKey: string, 
    buffer: Buffer, 
    mimeType: string, 
    metadata?: Record<string, string>
  ): Promise<string> {
    const bucket = this.buckets.photos;
    await this.minioClient.putObject(bucket, fileKey, buffer, buffer.length, {
      'Content-Type': mimeType,
      ...(metadata ?? {}),
    });
    return this.getPermanentUrl(bucket, fileKey);
  }

  /**
   * Get permanent MinIO URL (no expiration)
   */
  getPermanentUrl(bucket: string, fileKey: string): string {
    const protocol = minioUseSSL ? 'https' : 'http';
    return `${protocol}://${minioEndpoint}:${minioPort}/${bucket}/${fileKey}`;
  }

  /**
   * Get presigned URL (expires after specified time)
   */
  async getPresignedUrl(bucket: string, fileKey: string, expirySeconds = 60 * 60 * 24 * 7): Promise<string> {
    return this.minioClient.presignedGetObject(bucket, fileKey, expirySeconds);
  }

  /**
   * Delete file from specified bucket
   */
  async deleteFile(bucket: string, fileKey: string): Promise<void> {
    await this.minioClient.removeObject(bucket, fileKey);
  }

  /**
   * Stream file from specified bucket
   */
  async streamFile(bucket: string, fileKey: string): Promise<NodeJS.ReadableStream> {
    return this.minioClient.getObject(bucket, fileKey);
  }

  /**
   * Set public-read policy for a bucket (for photos)
   */
  private async setPublicPolicy(bucket: string): Promise<void> {
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
      console.log(`✅ Set public-read policy for bucket: ${bucket}`);
    } catch (error) {
      console.warn(`⚠️ Could not set public policy for ${bucket}:`, error.message);
    }
  }
}
