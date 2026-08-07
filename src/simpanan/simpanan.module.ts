import { Module } from '@nestjs/common';
import { SimpananController } from './simpanan.controller';
import { SimpananService } from './simpanan.service';

@Module({
  controllers: [SimpananController],
  providers: [SimpananService],
  exports: [SimpananService],
})
export class SimpananModule {}
