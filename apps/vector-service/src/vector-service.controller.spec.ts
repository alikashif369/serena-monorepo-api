import { Test, TestingModule } from '@nestjs/testing';
import { VectorServiceController } from './vector-service.controller';
import { VectorServiceService } from './vector-service.service';
import { PrismaService } from './prisma.service';

describe('VectorServiceController', () => {
  let vectorServiceController: VectorServiceController;

  const mockPrismaService = {
    vectorLayer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [VectorServiceController],
      providers: [
        VectorServiceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    vectorServiceController = app.get<VectorServiceController>(VectorServiceController);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(vectorServiceController).toBeDefined();
    });
  });
});
