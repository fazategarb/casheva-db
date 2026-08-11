import { Test, TestingModule } from '@nestjs/testing';
import { KopstukService } from './kopstuk.service';

describe('KopstukService', () => {
  let service: KopstukService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KopstukService],
    }).compile();

    service = module.get<KopstukService>(KopstukService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
