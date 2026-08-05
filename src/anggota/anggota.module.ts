import { Module } from '@nestjs/common';
import { AnggotaController } from './anggota.controller';
import { AnggotaService } from './anggota.service';

@Module({
  controllers: [AnggotaController],
  providers: [AnggotaService],
  exports: [AnggotaService],
})
export class AnggotaModule {}
