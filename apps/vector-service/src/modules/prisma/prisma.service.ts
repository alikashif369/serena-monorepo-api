import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { PrismaClient } from '@notiz/vector';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject('PrismaService') private readonly client: PrismaClient,
  ) {
    super({});
    Object.assign(this, client);
  }

  async onModuleInit() {
    await this.$connect();
  }
}
