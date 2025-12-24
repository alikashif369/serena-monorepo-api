import { PrismaClient } from '@prisma/client';
import * as imageLocations from '../../../serenagreen_old_code/src/assets/imagelocations.json';
import path from 'path';

const prisma = new PrismaClient();

async function seedPhotos() {
  console.log('Seeding Photos from imagelocations.json...');

  for (const location of imageLocations) {
    // Find site by location name (handle "Damb - Lasbela 2023" variants)
    const baseName = location.Name.replace(/\s*\d{4}\s*$/, '').trim();
    const site = await prisma.site.findFirst({
      where: {
        name: {
          contains: baseName,
          mode: 'insensitive'
        }
      }
    });

    if (!site) {
      console.warn(`Site not found for location: ${location.Name}`);
      continue;
    }

    // Seed photos
    for (let i = 0; i < location.image.length; i++) {
      const img = location.image[i];

      try {
        // For now, just store external URL
        // In future, could download and upload to MinIO
        const photo = {
          siteId: site.id,
          category: 'SITE' as const,
          latitude: img.lat,
          longitude: img.long,
          fileName: path.basename(img.source),
          originalFileName: path.basename(img.source),
          fileSize: BigInt(0), // Unknown
          mimeType: 'image/jpeg',
          minioUrl: img.source,  // External URL for now
          minioKey: img.source,
          description: `Legacy photo from ${location.Name}`,
          isActive: true
        };

        await prisma.photo.create({ data: photo });
        console.log(`✓ Seeded photo ${i+1}/${location.image.length} for ${site.name}`);
      } catch (error) {
        console.error(`Error seeding photo for ${site.name}:`, error);
      }
    }
  }

  console.log('✅ Photos seeding complete!');
}

seedPhotos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
