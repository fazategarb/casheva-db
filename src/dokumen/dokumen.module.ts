import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DokumenController } from './dokumen.controller';
import { DokumenService } from './dokumen.service';

@Module({
  imports: [PrismaModule],
  controllers: [DokumenController],
  providers: [DokumenService],
  exports: [DokumenService],
})
export class DokumenModule {}
