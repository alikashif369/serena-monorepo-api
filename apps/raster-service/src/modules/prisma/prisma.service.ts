import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@notiz/raster';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    this.$use(async (params, next) => {
      if (params.model === 'Raster' && params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { isActive: false };
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
