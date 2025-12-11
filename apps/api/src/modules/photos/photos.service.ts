import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../../common/services/minio.service';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { maxPhotoUploadSizeMB } from '@shared-config/env';

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private minio: MinioService,
  ) {}

  async upload(file: Express.Multer.File, dto: UploadPhotoDto, userId?: number) {
    // Validation
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG/PNG/WEBP files are allowed');
    }

    const maxMb = Number(maxPhotoUploadSizeMB);
    const maxSize = maxMb * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds ${maxMb}MB limit`);
    }

    // Validate category-specific requirements
    if (dto.category === 'EVENT' || dto.category === 'SITE') {
      if (!dto.siteId) {
        throw new BadRequestException('siteId is required for EVENT/SITE photos');
      }
      const site = await this.prisma.site.findUnique({ 
        where: { id: dto.siteId },
        select: { id: true, slug: true, name: true }
      });
      if (!site) {
        throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
      }
    }

    if (dto.category === 'SPECIES') {
      if (!dto.speciesId) {
        throw new BadRequestException('speciesId is required for SPECIES photos');
      }
      const species = await this.prisma.species.findFirst({ 
        where: { id: dto.speciesId },
        select: { botanicalName: true }
      });
      if (!species) {
        throw new NotFoundException(`Species with ID ${dto.speciesId} not found`);
      }
    }

    // Generate file key with hierarchical structure
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    let fileKey: string;
    let siteSlug: string | undefined;
    let speciesSlug: string | undefined;

    if (dto.category === 'SPECIES') {
      const species = await this.prisma.species.findFirst({ 
        where: { id: dto.speciesId },
        select: { botanicalName: true }
      });
      if (!species) {
        throw new NotFoundException(`Species with ID ${dto.speciesId} not found`);
      }
      speciesSlug = species.botanicalName!.toLowerCase().replace(/\s+/g, '-');
      fileKey = `species/${speciesSlug}/${timestamp}.${extension}`;
    } else {
      const site = await this.prisma.site.findUnique({ 
        where: { id: dto.siteId },
        select: { slug: true }
      });
      if (!site) {
        throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
      }
      siteSlug = site.slug;
      const year = dto.year ?? new Date().getFullYear();
      const categoryPrefix = dto.category.toLowerCase();
      fileKey = `sites/${siteSlug}/${year}/${categoryPrefix}_${timestamp}.${extension}`;
    }

    console.log('Uploading photo to MinIO:', { 
      category: dto.category, 
      fileKey, 
      size: file.size 
    });

    // Upload to MinIO photos bucket
    const minioUrl = await this.minio.uploadPhoto(fileKey, file.buffer, file.mimetype, {
      'original-name': file.originalname,
      'uploaded-by': String(userId || 'anonymous'),
      'category': dto.category,
    });

    // Create Photo record
    const photo = await this.prisma.photo.create({
      data: {
        fileName: `${timestamp}.${extension}`,
        originalFileName: file.originalname,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        minioUrl,
        minioKey: fileKey,
        category: dto.category as any,
        siteId: dto.siteId,
        speciesId: dto.speciesId,
        year: dto.year,
        latitude: dto.latitude,
        longitude: dto.longitude,
        caption: dto.caption,
        description: dto.description,
        tags: dto.tags || [],
        uploadedById: userId,
      },
    });

    return {
      ...photo,
      fileSize: photo.fileSize.toString(),
    };
  }

  async findAll(filters: {
    siteId?: number;
    speciesId?: number;
    year?: number;
    category?: string;
  }) {
    const photos = await this.prisma.photo.findMany({
      where: {
        isActive: true,
        ...(filters.siteId !== undefined ? { siteId: filters.siteId } : {}),
        ...(filters.speciesId !== undefined ? { speciesId: filters.speciesId } : {}),
        ...(filters.year !== undefined ? { year: filters.year } : {}),
        ...(filters.category !== undefined ? { category: filters.category as any } : {}),
      },
      include: {
        site: {
          select: { id: true, name: true, slug: true },
        },
        species: {
          select: { botanicalName: true, localName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return photos.map(p => ({ ...p, fileSize: p.fileSize.toString() }));
  }

  async findOne(id: number) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
      include: {
        site: true,
        species: true,
        uploadedBy: {
          select: { id: true, email: true, name: true },
        },
      },
    });
    
    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }
    
    return { ...photo, fileSize: photo.fileSize.toString() };
  }

  async update(id: number, dto: UpdatePhotoDto) {
    await this.findOne(id);
    
    const updated = await this.prisma.photo.update({
      where: { id },
      data: {
        ...(dto.caption !== undefined && { caption: dto.caption }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    });
    
    return { ...updated, fileSize: updated.fileSize.toString() };
  }

  async remove(id: number) {
    const photo = await this.findOne(id);
    
    // Delete from MinIO
    await this.minio.deleteFile(this.minio.buckets.photos, photo.minioKey);
    
    // Soft delete in database
    return this.prisma.photo.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
