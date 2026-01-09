import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { tileCacheEnabled, tileCachePath, tileCacheMaxSizeGB } from '@shared-config/env';

export interface CacheStats {
  enabled: boolean;
  path: string;
  totalSizeBytes: number;
  totalSizeMB: number;
  maxSizeGB: number;
  tileCount: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

@Injectable()
export class DiskTileCacheService implements OnModuleInit {
  private readonly enabled: boolean;
  private readonly cachePath: string;
  private readonly maxSizeBytes: number;

  // Stats tracking
  private hitCount = 0;
  private missCount = 0;

  // TTL by zoom level (in milliseconds)
  private readonly ttlByZoom: Record<number, number> = {
    // Low zoom - 7 days (overview tiles)
    0: 7 * 24 * 60 * 60 * 1000,
    1: 7 * 24 * 60 * 60 * 1000,
    2: 7 * 24 * 60 * 60 * 1000,
    3: 7 * 24 * 60 * 60 * 1000,
    4: 7 * 24 * 60 * 60 * 1000,
    5: 7 * 24 * 60 * 60 * 1000,
    6: 7 * 24 * 60 * 60 * 1000,
    // Mid zoom - 3 days (region level)
    7: 3 * 24 * 60 * 60 * 1000,
    8: 3 * 24 * 60 * 60 * 1000,
    9: 3 * 24 * 60 * 60 * 1000,
    10: 3 * 24 * 60 * 60 * 1000,
    // Site zoom - 24 hours
    11: 24 * 60 * 60 * 1000,
    12: 24 * 60 * 60 * 1000,
    13: 24 * 60 * 60 * 1000,
    14: 24 * 60 * 60 * 1000,
    // Detail zoom - 12 hours
    15: 12 * 60 * 60 * 1000,
    16: 12 * 60 * 60 * 1000,
    17: 12 * 60 * 60 * 1000,
    // High detail - 4 hours
    18: 4 * 60 * 60 * 1000,
    19: 4 * 60 * 60 * 1000,
    20: 4 * 60 * 60 * 1000,
    21: 4 * 60 * 60 * 1000,
    22: 4 * 60 * 60 * 1000,
  };

  constructor() {
    this.enabled = tileCacheEnabled;
    this.cachePath = tileCachePath;
    this.maxSizeBytes = tileCacheMaxSizeGB * 1024 * 1024 * 1024;
  }

  async onModuleInit() {
    if (!this.enabled) {
      console.log('[TileCache] Disk tile cache is DISABLED');
      return;
    }

    // Ensure cache directory exists
    try {
      await fs.promises.mkdir(this.cachePath, { recursive: true });
      console.log(`[TileCache] Disk tile cache enabled at: ${this.cachePath}`);
      console.log(`[TileCache] Max cache size: ${tileCacheMaxSizeGB} GB`);

      // Run initial cleanup of expired tiles
      this.cleanExpiredTiles().catch(err =>
        console.warn('[TileCache] Initial cleanup failed:', err.message)
      );
    } catch (error) {
      console.error('[TileCache] Failed to create cache directory:', error.message);
    }
  }

  /**
   * Get TTL in seconds for HTTP cache headers
   */
  getTTLSeconds(zoomLevel: number): number {
    const ttlMs = this.ttlByZoom[zoomLevel] ?? this.ttlByZoom[14];
    return Math.floor(ttlMs / 1000);
  }

  /**
   * Get cached tile from disk
   */
  async get(rasterId: number, z: number, x: number, y: number): Promise<Buffer | null> {
    if (!this.enabled) {
      return null;
    }

    const filePath = this.getTilePath(rasterId, z, x, y);

    try {
      const stats = await fs.promises.stat(filePath);
      const ttl = this.ttlByZoom[z] ?? this.ttlByZoom[14]; // Default to zoom 14 TTL
      const age = Date.now() - stats.mtime.getTime();

      // Check if tile is expired
      if (age > ttl) {
        // Delete expired tile
        await fs.promises.unlink(filePath).catch(() => {});
        this.missCount++;
        return null;
      }

      // Read and return cached tile
      const buffer = await fs.promises.readFile(filePath);
      this.hitCount++;
      return buffer;
    } catch (error) {
      // File doesn't exist or read error
      this.missCount++;
      return null;
    }
  }

  /**
   * Save tile to disk cache
   */
  async set(rasterId: number, z: number, x: number, y: number, buffer: Buffer): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const filePath = this.getTilePath(rasterId, z, x, y);
    const dirPath = path.dirname(filePath);

    try {
      // Ensure directory exists
      await fs.promises.mkdir(dirPath, { recursive: true });

      // Write tile to disk
      await fs.promises.writeFile(filePath, buffer);
    } catch (error) {
      console.warn(`[TileCache] Failed to cache tile ${filePath}:`, error.message);
    }

    // Periodically check cache size (every ~100 tiles)
    if (Math.random() < 0.01) {
      this.evictIfNeeded().catch(err =>
        console.warn('[TileCache] Eviction check failed:', err.message)
      );
    }
  }

  /**
   * Invalidate all cached tiles for a raster
   */
  async invalidateRaster(rasterId: number): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const rasterPath = path.join(this.cachePath, String(rasterId));

    try {
      await fs.promises.rm(rasterPath, { recursive: true, force: true });
      console.log(`[TileCache] Invalidated cache for raster ${rasterId}`);
    } catch (error) {
      // Directory might not exist, that's fine
      if (error.code !== 'ENOENT') {
        console.warn(`[TileCache] Failed to invalidate raster ${rasterId}:`, error.message);
      }
    }
  }

  /**
   * Clear entire tile cache
   */
  async invalidateAll(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const entries = await fs.promises.readdir(this.cachePath);
      for (const entry of entries) {
        const entryPath = path.join(this.cachePath, entry);
        await fs.promises.rm(entryPath, { recursive: true, force: true });
      }
      console.log('[TileCache] Cleared all cached tiles');
      this.hitCount = 0;
      this.missCount = 0;
    } catch (error) {
      console.error('[TileCache] Failed to clear cache:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.hitCount + this.missCount;

    if (!this.enabled) {
      return {
        enabled: false,
        path: this.cachePath,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        maxSizeGB: tileCacheMaxSizeGB,
        tileCount: 0,
        hitCount: this.hitCount,
        missCount: this.missCount,
        hitRate: 0,
      };
    }

    try {
      const { size, count } = await this.calculateCacheSize();
      return {
        enabled: true,
        path: this.cachePath,
        totalSizeBytes: size,
        totalSizeMB: Math.round(size / (1024 * 1024) * 100) / 100,
        maxSizeGB: tileCacheMaxSizeGB,
        tileCount: count,
        hitCount: this.hitCount,
        missCount: this.missCount,
        hitRate: totalRequests > 0 ? Math.round((this.hitCount / totalRequests) * 100) / 100 : 0,
      };
    } catch (error) {
      return {
        enabled: true,
        path: this.cachePath,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        maxSizeGB: tileCacheMaxSizeGB,
        tileCount: 0,
        hitCount: this.hitCount,
        missCount: this.missCount,
        hitRate: totalRequests > 0 ? Math.round((this.hitCount / totalRequests) * 100) / 100 : 0,
      };
    }
  }

  /**
   * Get file path for a tile
   */
  private getTilePath(rasterId: number, z: number, x: number, y: number): string {
    return path.join(this.cachePath, String(rasterId), String(z), String(x), `${y}.png`);
  }

  /**
   * Calculate total cache size and tile count
   */
  private async calculateCacheSize(): Promise<{ size: number; count: number }> {
    let totalSize = 0;
    let tileCount = 0;

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.name.endsWith('.png')) {
            try {
              const stats = await fs.promises.stat(fullPath);
              totalSize += stats.size;
              tileCount++;
            } catch {
              // Skip files we can't stat
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    await walkDir(this.cachePath);
    return { size: totalSize, count: tileCount };
  }

  /**
   * Evict old tiles if cache exceeds max size
   */
  private async evictIfNeeded(): Promise<void> {
    const { size } = await this.calculateCacheSize();

    if (size <= this.maxSizeBytes) {
      return;
    }

    console.log(`[TileCache] Cache size (${Math.round(size / (1024 * 1024))}MB) exceeds limit, starting eviction...`);

    // Collect all tiles with their modification times
    const tiles: Array<{ path: string; mtime: number; size: number }> = [];

    const collectTiles = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await collectTiles(fullPath);
          } else if (entry.name.endsWith('.png')) {
            try {
              const stats = await fs.promises.stat(fullPath);
              tiles.push({
                path: fullPath,
                mtime: stats.mtime.getTime(),
                size: stats.size,
              });
            } catch {
              // Skip files we can't stat
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    await collectTiles(this.cachePath);

    // Sort by modification time (oldest first)
    tiles.sort((a, b) => a.mtime - b.mtime);

    // Delete oldest tiles until we're at 80% capacity
    const targetSize = this.maxSizeBytes * 0.8;
    let currentSize = size;
    let deletedCount = 0;

    for (const tile of tiles) {
      if (currentSize <= targetSize) {
        break;
      }
      try {
        await fs.promises.unlink(tile.path);
        currentSize -= tile.size;
        deletedCount++;
      } catch {
        // Skip files we can't delete
      }
    }

    console.log(`[TileCache] Evicted ${deletedCount} tiles, new size: ${Math.round(currentSize / (1024 * 1024))}MB`);
  }

  /**
   * Clean up expired tiles
   */
  private async cleanExpiredTiles(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    const cleanDir = async (dir: string, zoomLevel?: number): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // If we're at raster level, next level is zoom
            // If we're at zoom level, pass the zoom to children
            const nextZoom = zoomLevel === undefined ? parseInt(entry.name) : zoomLevel;
            await cleanDir(fullPath, isNaN(nextZoom) ? undefined : nextZoom);

            // Remove empty directories
            try {
              const remaining = await fs.promises.readdir(fullPath);
              if (remaining.length === 0) {
                await fs.promises.rmdir(fullPath);
              }
            } catch {
              // Skip if can't remove
            }
          } else if (entry.name.endsWith('.png') && zoomLevel !== undefined) {
            try {
              const stats = await fs.promises.stat(fullPath);
              const ttl = this.ttlByZoom[zoomLevel] ?? this.ttlByZoom[14];
              const age = now - stats.mtime.getTime();

              if (age > ttl) {
                await fs.promises.unlink(fullPath);
                cleanedCount++;
              }
            } catch {
              // Skip files we can't process
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    // Start from cache root, raster folders are first level
    try {
      const rasterFolders = await fs.promises.readdir(this.cachePath, { withFileTypes: true });
      for (const rasterFolder of rasterFolders) {
        if (rasterFolder.isDirectory()) {
          await cleanDir(path.join(this.cachePath, rasterFolder.name));
        }
      }
    } catch {
      // Cache dir might not exist yet
    }

    if (cleanedCount > 0) {
      console.log(`[TileCache] Cleaned ${cleanedCount} expired tiles`);
    }
  }
}
