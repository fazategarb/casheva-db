import { Test, TestingModule } from '@nestjs/testing';
import { TajukTtdController } from './tajuk-ttd.controller';

describe('TajukTtdController', () => {
  let controller: TajukTtdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TajukTtdController],
    }).compile();

    controller = module.get<TajukTtdController>(TajukTtdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
