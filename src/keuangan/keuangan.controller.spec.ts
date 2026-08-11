import { Test, TestingModule } from '@nestjs/testing';
import { KeuanganController } from './keuangan.controller';

describe('KeuanganController', () => {
  let controller: KeuanganController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeuanganController],
    }).compile();

    controller = module.get<KeuanganController>(KeuanganController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
