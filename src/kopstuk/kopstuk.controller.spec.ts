import { Test, TestingModule } from '@nestjs/testing';
import { KopstukController } from './kopstuk.controller';

describe('KopstukController', () => {
  let controller: KopstukController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KopstukController],
    }).compile();

    controller = module.get<KopstukController>(KopstukController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
