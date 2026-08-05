import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PangkatService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.pangkat.findMany({
      orderBy: { kodePkt: 'desc' },
    });
  }

  findByKodePkt(kodePkt: number) {
    return this.prisma.pangkat.findUnique({
      where: { kodePkt },
    });
  }
}
