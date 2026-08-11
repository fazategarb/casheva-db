import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnggotaController } from './anggota.controller';
import { AnggotaService } from './anggota.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnggotaController],
  providers: [AnggotaService],
  exports: [AnggotaService],
})
export class AnggotaModule {}
