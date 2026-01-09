import { Module, Global } from '@nestjs/common';
import { DiskTileCacheService } from './disk-tile-cache.service';

@Global()
@Module({
  providers: [DiskTileCacheService],
  exports: [DiskTileCacheService],
})
export class TileCacheModule {}
