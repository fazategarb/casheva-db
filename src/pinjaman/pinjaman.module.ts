import { Module } from '@nestjs/common';
import { PinjamanController } from './pinjaman.controller';
import { PinjamanService } from './pinjaman.service';

@Module({
  controllers: [PinjamanController],
  providers: [PinjamanService],
})
export class PinjamanModule {}
