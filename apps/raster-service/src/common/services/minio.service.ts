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
    return this.getFileUrl(fileKey);
  }

  async getFileUrl(fileKey: string): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucket, fileKey, 60 * 60 * 24 * 7);
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, fileKey);
  }

  async streamFile(fileKey: string): Promise<NodeJS.ReadableStream> {
    return this.minioClient.getObject(this.bucket, fileKey);
  }
}
