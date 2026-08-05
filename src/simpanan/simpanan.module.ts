import { Module } from '@nestjs/common';
import { SimpananController } from './simpanan.controller';
import { SimpananService } from './simpanan.service';

@Module({
  controllers: [SimpananController],
  providers: [SimpananService],
})
export class SimpananModule {}
