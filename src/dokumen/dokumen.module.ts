import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { DokumenController } from './dokumen.controller';
import { DokumenService } from './dokumen.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [DokumenController],
  providers: [DokumenService],
  exports: [DokumenService],
})
export class DokumenModule {}
