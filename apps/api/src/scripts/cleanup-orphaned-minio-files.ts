/**
 * Cleanup Orphaned MinIO Files Script
 * 
 * This script finds and optionally deletes files in MinIO that are not referenced
 * in the database. Run periodically as a maintenance task.
 * 
 * Usage:
 *   DRY RUN (safe): npm run cleanup-minio -- --dry-run
 *   REAL CLEANUP:   npm run cleanup-minio
 * 
 * Add to package.json:
 *   "scripts": {
 *     "cleanup-minio": "ts-node src/scripts/cleanup-orphaned-minio-files.ts"
 *   }
 */

import { PrismaClient } from '@prisma/client';
import * as Minio from 'minio';
import {
  minioEndpoint,
  minioPort,
  minioAccessKey,
  minioSecretKey,
  minioUseSSL,
  minioBucketRastersBase,
  minioBucketRastersClassified,
  minioBucketPhotos,
} from '@shared-config/env';

const prisma = new PrismaClient();
const minioClient = new Minio.Client({
  endPoint: minioEndpoint,
  port: parseInt(minioPort, 10),
  useSSL: minioUseSSL,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
});

interface OrphanedFile {
  bucket: string;
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * Get all files from a MinIO bucket
 */
async function listAllFilesInBucket(bucket: string): Promise<string[]> {
  const files: string[] = [];
  const stream = minioClient.listObjectsV2(bucket, '', true);

  for await (const obj of stream) {
    if (obj.name) {
      files.push(obj.name);
    }
  }

  return files;
}

/**
 * Get all file paths referenced in the database
 */
async function getReferencedFiles(): Promise<Set<string>> {
  const referenced = new Set<string>();

  // Get raster files
  const rasters = await prisma.raster.findMany({
    select: { minioUrl: true },
  });
  
  for (const raster of rasters) {
    if (raster.minioUrl) {
      // Extract file key from URL
      // Format: http://localhost:9000/bucket-name/path/to/file.tif
      // or: /bucket-name/path/to/file.tif
      const key = extractFileKeyFromUrl(raster.minioUrl);
      if (key) referenced.add(key);
    }
  }

  // Get photo files
  const photos = await prisma.photo.findMany({
    select: { minioUrl: true },
  });
  
  for (const photo of photos) {
    if (photo.minioUrl) {
      const key = extractFileKeyFromUrl(photo.minioUrl);
      if (key) referenced.add(key);
    }
  }

  // Get species reference images
  const species = await prisma.species.findMany({
    select: { image1Url: true, image2Url: true, image3Url: true, image4Url: true },
  });
  
  for (const sp of species) {
    [sp.image1Url, sp.image2Url, sp.image3Url, sp.image4Url].forEach(url => {
      if (url && isMinioUrl(url)) {
        const key = extractFileKeyFromUrl(url);
        if (key) referenced.add(key);
      }
    });
  }

  return referenced;
}

/**
 * Check if URL is a MinIO URL
 */
function isMinioUrl(url: string): boolean {
  if (!url) return false;
  return url.includes(minioEndpoint) || url.startsWith('/serena-') || url.includes('localhost:9000');
}

/**
 * Extract file key from MinIO URL
 * Input: http://localhost:9000/bucket-name/path/to/file.tif
 * Output: bucket-name/path/to/file.tif
 */
function extractFileKeyFromUrl(url: string): string | null {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    } else {
      // Relative path format
      return url.startsWith('/') ? url.substring(1) : url;
    }
  } catch (error) {
    console.warn('Failed to parse URL:', url, error.message);
    return null;
  }
}

/**
 * Find orphaned files in a bucket
 */
async function findOrphanedFilesInBucket(
  bucket: string,
  referencedFiles: Set<string>
): Promise<OrphanedFile[]> {
  console.log(`\n🔍 Checking bucket: ${bucket}`);
  
  const allFiles = await listAllFilesInBucket(bucket);
  console.log(`   Total files in bucket: ${allFiles.length}`);
  
  const orphaned: OrphanedFile[] = [];
  
  for (const fileKey of allFiles) {
    const fullKey = `${bucket}/${fileKey}`;
    
    if (!referencedFiles.has(fullKey)) {
      // Get file metadata
      try {
        const stat = await minioClient.statObject(bucket, fileKey);
        orphaned.push({
          bucket,
          key: fileKey,
          size: stat.size,
          lastModified: stat.lastModified,
        });
      } catch (error) {
        console.warn(`   ⚠️ Could not get stats for ${fileKey}:`, error.message);
      }
    }
  }
  
  console.log(`   Orphaned files found: ${orphaned.length}`);
  return orphaned;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Main cleanup function
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('🧹 MinIO Orphaned Files Cleanup Script');
  console.log('========================================');
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no files will be deleted)' : '⚠️ REAL CLEANUP (files will be deleted!)'}`);
  console.log(`MinIO: ${minioEndpoint}:${minioPort}`);
  console.log(`Buckets: ${minioBucketRastersBase}, ${minioBucketRastersClassified}, ${minioBucketPhotos}`);
  
  // Get all referenced files from database
  console.log('\n📊 Scanning database for referenced files...');
  const referencedFiles = await getReferencedFiles();
  console.log(`   Found ${referencedFiles.size} referenced files in database`);
  
  // Check each bucket
  const allOrphaned: OrphanedFile[] = [];
  
  for (const bucket of [minioBucketRastersBase, minioBucketRastersClassified, minioBucketPhotos]) {
    const orphaned = await findOrphanedFilesInBucket(bucket, referencedFiles);
    allOrphaned.push(...orphaned);
  }
  
  // Summary
  console.log('\n📈 SUMMARY');
  console.log('==========');
  console.log(`Total orphaned files: ${allOrphaned.length}`);
  
  if (allOrphaned.length === 0) {
    console.log('✅ No orphaned files found. Storage is clean!');
    return;
  }
  
  const totalSize = allOrphaned.reduce((sum, file) => sum + file.size, 0);
  console.log(`Total wasted space: ${formatBytes(totalSize)}`);
  
  // Show details
  console.log('\n📋 ORPHANED FILES:');
  allOrphaned
    .sort((a, b) => b.size - a.size) // Sort by size descending
    .slice(0, 20) // Show top 20
    .forEach((file, index) => {
      console.log(`   ${index + 1}. [${file.bucket}] ${file.key}`);
      console.log(`      Size: ${formatBytes(file.size)}, Last modified: ${file.lastModified.toISOString()}`);
    });
  
  if (allOrphaned.length > 20) {
    console.log(`   ... and ${allOrphaned.length - 20} more files`);
  }
  
  // Delete if not dry run
  if (!isDryRun) {
    console.log('\n⚠️ DELETING ORPHANED FILES...');
    
    if (!process.argv.includes('--confirm')) {
      console.log('❌ ERROR: Real cleanup requires --confirm flag');
      console.log('   Run with: npm run cleanup-minio -- --confirm');
      process.exit(1);
    }
    
    let deleted = 0;
    let failed = 0;
    
    for (const file of allOrphaned) {
      try {
        await minioClient.removeObject(file.bucket, file.key);
        deleted++;
        console.log(`   ✓ Deleted: ${file.bucket}/${file.key}`);
      } catch (error) {
        failed++;
        console.error(`   ✗ Failed to delete: ${file.bucket}/${file.key}`, error.message);
      }
    }
    
    console.log(`\n✅ Cleanup complete: ${deleted} deleted, ${failed} failed`);
  } else {
    console.log('\n💡 TIP: To delete these files, run:');
    console.log('   npm run cleanup-minio -- --confirm');
  }
}

// Run the script
main()
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
