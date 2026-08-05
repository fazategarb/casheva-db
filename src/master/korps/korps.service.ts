import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KorpsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.korps.findMany({
      orderBy: { kode: 'asc' },
    });
  }

  findByKode(kode: string) {
    return this.prisma.korps.findUnique({
      where: { kode },
    });
  }
}
