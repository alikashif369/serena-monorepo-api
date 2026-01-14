import { Injectable, NotFoundException, ConflictException, BadRequestException, PayloadTooLargeException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../../common/services/minio.service';
import { maxPhotoUploadSizeMB, minioEndpoint, minioPort } from '@shared-config/env';

@Injectable()
export class SpeciesService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  /**
   * Helper: Check if URL is a MinIO URL from our server
   */
  private isMinioUrl(url: string): boolean {
    if (!url) return false;
    const minioBaseUrl = `${minioEndpoint}:${minioPort}`;
    return url.includes(minioBaseUrl) && url.includes('species/reference-images/');
  }

  /**
   * Helper: Extract file key from MinIO URL
   * Example: http://localhost:9000/serena-photos/species/reference-images/123-abc.jpg
   * Returns: species/reference-images/123-abc.jpg
   */
  private extractMinioFileKey(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Remove leading empty string and bucket name
      const bucketIndex = pathParts.findIndex(part => part === this.minioService.buckets.photos);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch (error) {
      console.error('Error parsing MinIO URL:', error);
      return null;
    }
  }

  /**
   * Helper: Delete old MinIO image if it's being replaced
   */
  private async cleanupOldImage(oldUrl: string): Promise<void> {
    if (!oldUrl || !this.isMinioUrl(oldUrl)) {
      // Not a MinIO URL (external URL or empty), skip cleanup
      return;
    }

    try {
      const fileKey = this.extractMinioFileKey(oldUrl);
      if (fileKey) {
        await this.minioService.deleteFile(this.minioService.buckets.photos, fileKey);
        console.log(`✅ Cleaned up old species image: ${fileKey}`);
      }
    } catch (error) {
      // Log error but don't fail the update
      console.warn(`⚠️ Failed to cleanup old image ${oldUrl}:`, error.message);
    }
  }

  async findAll(query?: any) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { botanicalName: { contains: query.search, mode: 'insensitive' } },
        { localName: { contains: query.search, mode: 'insensitive' } },
        { englishName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.species.findMany({
      where,
      orderBy: { botanicalName: 'asc' },
    });
  }

  async findOne(id: number) {
    const species = await this.prisma.species.findUnique({
      where: { id },
    });

    if (!species) {
      throw new NotFoundException(`Species with ID ${id} not found`);
    }

    return species;
  }

  async create(dto: any) {
    try {
      // Handle both scientificName and botanicalName (legacy)
      const scientificName = dto.scientificName || dto.botanicalName;
      const botanicalName = dto.botanicalName || dto.scientificName;

      if (!scientificName) {
        throw new Error('Scientific name is required');
      }

      return await this.prisma.species.create({
        data: {
          scientificName,
          botanicalName,
          localName: dto.localName,
          englishName: dto.englishName,
          description: dto.description,
          uses: dto.uses,
          // Required image fields
          image1Url: dto.image1Url,
          image2Url: dto.image2Url,
          image3Url: dto.image3Url,
          image4Url: dto.image4Url,
          // Optional fields
          code: dto.code || undefined,
          imagePath: dto.imagePath || undefined,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Species with scientific name already exists`);
      }
      throw error;
    }
  }

  async update(id: number, dto: any) {
    const species = await this.prisma.species.findUnique({
      where: { id },
    });

    if (!species) {
      throw new NotFoundException(`Species with ID ${id} not found`);
    }

    // Cleanup old MinIO images if they're being replaced with new ones
    const cleanupPromises: Promise<void>[] = [];

    if (dto.image1Url !== undefined && dto.image1Url !== species.image1Url) {
      cleanupPromises.push(this.cleanupOldImage(species.image1Url));
    }
    if (dto.image2Url !== undefined && dto.image2Url !== species.image2Url) {
      cleanupPromises.push(this.cleanupOldImage(species.image2Url));
    }
    if (dto.image3Url !== undefined && dto.image3Url !== species.image3Url) {
      cleanupPromises.push(this.cleanupOldImage(species.image3Url));
    }
    if (dto.image4Url !== undefined && dto.image4Url !== species.image4Url) {
      cleanupPromises.push(this.cleanupOldImage(species.image4Url));
    }

    // Wait for cleanup to complete (non-blocking errors)
    await Promise.allSettled(cleanupPromises);

    // Prepare update data
    const updateData: any = {};

    // Handle scientificName and botanicalName
    if (dto.scientificName !== undefined) {
      updateData.scientificName = dto.scientificName;
      // Also update botanicalName to keep them in sync
      if (!dto.botanicalName) {
        updateData.botanicalName = dto.scientificName;
      }
    }
    if (dto.botanicalName !== undefined) {
      updateData.botanicalName = dto.botanicalName;
    }

    // Other fields
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.localName !== undefined) updateData.localName = dto.localName;
    if (dto.englishName !== undefined) updateData.englishName = dto.englishName;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.uses !== undefined) updateData.uses = dto.uses;
    if (dto.imagePath !== undefined) updateData.imagePath = dto.imagePath;
    if (dto.image1Url !== undefined) updateData.image1Url = dto.image1Url;
    if (dto.image2Url !== undefined) updateData.image2Url = dto.image2Url;
    if (dto.image3Url !== undefined) updateData.image3Url = dto.image3Url;
    if (dto.image4Url !== undefined) updateData.image4Url = dto.image4Url;

    return this.prisma.species.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: number) {
    const species = await this.prisma.species.findUnique({
      where: { id },
    });

    if (!species) {
      throw new NotFoundException(`Species with ID ${id} not found`);
    }

    // Cleanup all MinIO images before deleting the species record
    const cleanupPromises: Promise<void>[] = [
      this.cleanupOldImage(species.image1Url),
      this.cleanupOldImage(species.image2Url),
      this.cleanupOldImage(species.image3Url),
      this.cleanupOldImage(species.image4Url),
    ];

    // Wait for cleanup to complete (non-blocking errors)
    await Promise.allSettled(cleanupPromises);

    return this.prisma.species.delete({
      where: { id },
    });
  }

  async uploadReferenceImage(file: Express.Multer.File): Promise<{ url: string }> {
    // 1. Validate file presence
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // 2. Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // 3. Validate file size (convert MB to bytes)
    const maxSizeBytes = parseInt(maxPhotoUploadSizeMB, 10) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum allowed size of ${maxPhotoUploadSizeMB}MB`
      );
    }

    try {
      // 4. Generate unique file key with timestamp and random string
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.mimetype.split('/')[1]; // 'jpeg', 'png', or 'webp'
      const fileKey = `species/reference-images/${timestamp}-${randomStr}.${ext}`;

      // 5. Upload to MinIO
      const url = await this.minioService.uploadPhoto(
        fileKey,
        file.buffer,
        file.mimetype,
        {
          'original-name': file.originalname,
          'category': 'species-reference',
        }
      );

      // 6. Return permanent URL
      return { url };
    } catch (error) {
      console.error('Error uploading species reference image:', error);
      throw new InternalServerErrorException('Failed to upload image to storage');
    }
  }
}
