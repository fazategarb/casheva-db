import { Test, TestingModule } from '@nestjs/testing';
import { TajukTtdService } from './tajuk-ttd.service';

describe('TajukTtdService', () => {
  let service: TajukTtdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TajukTtdService],
    }).compile();

    service = module.get<TajukTtdService>(TajukTtdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
