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
    // Test MinIO authentication by attempting to list buckets
    try {
      await this.minioClient.listBuckets();
      console.log('✅ MinIO authentication successful');
    } catch (error) {
      console.error('❌ MinIO authentication FAILED:', error.message);
      console.error('   Check MINIO_ACCESS_KEY and MINIO_SECRET_KEY environment variables');
      throw new Error(`MinIO authentication failed: ${error.message}`);
    }

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
   * Includes timeout, retry logic, and verification to prevent orphaned DB records
   */
  async uploadRaster(
    fileKey: string,
    buffer: Buffer,
    isClassified: boolean,
    metadata?: Record<string, string>
  ): Promise<string> {
    const bucket = isClassified ? this.buckets.rastersClassified : this.buckets.rastersBase;

    try {
      // Upload with 5-minute timeout and retry on network failures
      await this.retryOperation(
        () => this.uploadWithTimeout(
          () => this.minioClient.putObject(bucket, fileKey, buffer, buffer.length, {
            'Content-Type': 'image/tiff',
            ...(metadata ?? {}),
          }),
          5 * 60 * 1000 // 5 minutes timeout
        ),
        3, // max retries
        1000 // base delay 1 second
      );

      // Verify upload succeeded by checking if file exists
      const exists = await this.fileExists(bucket, fileKey);
      if (!exists) {
        throw new Error('Upload completed but file not found in storage');
      }

      return this.getPermanentUrl(bucket, fileKey);
    } catch (error) {
      throw new Error(`MinIO upload failed: ${error.message}`);
    }
  }

  /**
   * Upload photo file to photos bucket
   * Includes timeout, retry logic, and verification
   */
  async uploadPhoto(
    fileKey: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const bucket = this.buckets.photos;

    try {
      // Upload with 2-minute timeout and retry on network failures
      await this.retryOperation(
        () => this.uploadWithTimeout(
          () => this.minioClient.putObject(bucket, fileKey, buffer, buffer.length, {
            'Content-Type': mimeType,
            ...(metadata ?? {}),
          }),
          2 * 60 * 1000 // 2 minutes timeout
        ),
        3, // max retries
        1000 // base delay 1 second
      );

      // Verify upload succeeded
      const exists = await this.fileExists(bucket, fileKey);
      if (!exists) {
        throw new Error('Upload completed but file not found in storage');
      }

      return this.getPermanentUrl(bucket, fileKey);
    } catch (error) {
      throw new Error(`MinIO upload failed: ${error.message}`);
    }
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

  /**
   * Retry an operation with exponential backoff on network failures
   * Only retries on network errors, not on validation errors
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000,
  ): Promise<T> {
    let lastError: Error = new Error('Operation failed after retries');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on validation errors or non-network errors
        const errorMessage = error.message?.toLowerCase() || '';
        const isNetworkError = 
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('econnrefused') ||
          errorMessage.includes('econnreset') ||
          errorMessage.includes('etimedout') ||
          errorMessage.includes('socket');

        if (!isNetworkError || attempt === maxRetries) {
          throw error;
        }

        // Calculate exponential backoff delay: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️ MinIO operation failed (attempt ${attempt}/${maxRetries}), retrying after ${delay}ms...`);
        console.log(`   Error: ${error.message}`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Execute an async operation with timeout
   */
  private async uploadWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Upload timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Check if a file exists in the specified bucket
   */
  private async fileExists(bucket: string, fileKey: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucket, fileKey);
      return true;
    } catch (error) {
      // statObject throws an error if the file doesn't exist
      return false;
    }
  }
}
