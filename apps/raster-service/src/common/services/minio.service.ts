import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { minioEndpoint, minioPort, minioAccessKey, minioSecretKey, minioBucket, minioUseSSL } from '@shared-config/env';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor() {
    this.bucket = minioBucket;
    this.minioClient = new Minio.Client({
      endPoint: minioEndpoint,
      port: parseInt(minioPort, 10),
      useSSL: minioUseSSL,
      accessKey: minioAccessKey,
      secretKey: minioSecretKey,
    });
  }

  async onModuleInit() {
    if (!this.bucket) return;
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async uploadFile(fileKey: string, fileBuffer: Buffer, metadata?: Record<string, string>): Promise<string> {
    await this.minioClient.putObject(this.bucket, fileKey, fileBuffer, fileBuffer.length, {
      'Content-Type': 'image/tiff',
      ...(metadata ?? {}),
    });
    return this.getPermanentUrl(fileKey);
  }

  /**
   * Get permanent MinIO URL (no expiration)
   * Requires bucket to be public or TiTiler to have MinIO credentials
   */
  getPermanentUrl(fileKey: string): string {
    const protocol = minioUseSSL ? 'https' : 'http';
    return `${protocol}://${minioEndpoint}:${minioPort}/${this.bucket}/${fileKey}`;
  }

  /**
   * Get presigned URL (expires after specified time)
   * Use this only if you need temporary access control
   */
  async getPresignedUrl(fileKey: string, expirySeconds = 60 * 60 * 24 * 7): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucket, fileKey, expirySeconds);
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, fileKey);
  }

  async streamFile(fileKey: string): Promise<NodeJS.ReadableStream> {
    return this.minioClient.getObject(this.bucket, fileKey);
  }
}
