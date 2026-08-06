import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PinjamanController } from './pinjaman.controller';
import { PinjamanService } from './pinjaman.service';

@Module({
  imports: [PrismaModule], // Tambahkan PrismaModule
  controllers: [PinjamanController],
  providers: [PinjamanService],
  exports: [PinjamanService],
})
export class PinjamanModule {}
