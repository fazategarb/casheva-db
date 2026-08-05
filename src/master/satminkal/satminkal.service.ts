import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SatminkalService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(kotamaKode?: string) {
    return this.prisma.satminkal.findMany({
      where: kotamaKode
        ? { kotama: { kode: kotamaKode } }
        : undefined,
      orderBy: { kode: 'asc' },
      include: { kotama: { select: { kode: true, nama: true } } },
    });
  }

  findByKode(kode: string) {
    return this.prisma.satminkal.findUnique({
      where: { kode },
      include: { kotama: true },
    });
  }
}
