import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KotamaService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.kotama.findMany({
      orderBy: { kode: 'asc' },
    });
  }

  findByKode(kode: string) {
    return this.prisma.kotama.findUnique({
      where: { kode },
      include: { satminkal: { orderBy: { kode: 'asc' } } },
    });
  }
}
