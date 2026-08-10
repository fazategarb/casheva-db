import { Module } from '@nestjs/common';
import { KeuanganController } from './keuangan.controller';
import { KeuanganService } from './keuangan.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KeuanganController],
  providers: [KeuanganService],
  exports: [KeuanganService],
})
export class KeuanganModule {}
