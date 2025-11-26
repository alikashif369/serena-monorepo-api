import { Module } from '@nestjs/common';
import { CustomPrismaModule } from 'nestjs-prisma';
import { PrismaClient } from '@notiz/auth';
import { PrismaService } from './prisma.service';

// Extend the generated client with soft-delete defaults
const softDeleteClient = new PrismaClient().$extends({
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ args, query }: any) {
        args = {
          ...args,
          where: { ...args?.where, deletedAt: { isSet: false } },
        };
        return query(args);
      },
      async count({ args, query }: any) {
        args = {
          ...args,
          where: { ...args?.where, deletedAt: { isSet: false } },
        };
        return query(args);
      },
      async findUnique({ args, query }: any) {
        args = {
          ...args,
          where: { ...args?.where, deletedAt: { isSet: false } },
        };
        return query(args);
      },
    },
  },
});

@Module({
  imports: [
    CustomPrismaModule.forRoot({
      name: 'PrismaService',
      client: softDeleteClient,
    }),
  ],
  providers: [PrismaService],
  exports: [CustomPrismaModule, PrismaService],
})
export class PrismaModule {}
