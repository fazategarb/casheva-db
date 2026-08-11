import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Sesuaikan path PrismaService Anda
import { CreateKopstukDto } from './dto/create-kopstuk.dto';

@Injectable()
export class KopstukService {
  constructor(private prisma: PrismaService) {}

  async upsertBySatminkal(satminkalId: string, dto: CreateKopstukDto) {
    return this.prisma.kopstuk.upsert({
      where: { satminkalId },
      create: {
        satminkalId,
        ...dto,
      },
      update: dto,
    });
  }

  async getBySatminkal(satminkalId: string) {
    const kopstuk = await this.prisma.kopstuk.findUnique({
      where: { satminkalId },
    });
    if (!kopstuk) {
      // Return default/fallback kopstuk jika belum dikonfigurasi spesifik
      return this.prisma.kopstuk.findFirst({
        where: { satminkalId: null },
      });
    }
    return kopstuk;
  }
}
