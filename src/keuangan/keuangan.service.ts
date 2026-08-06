import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBiayaDto, CreatePendapatanDto } from './dto/keuangan.dto';

@Injectable()
export class KeuanganService {
  constructor(private readonly prisma: PrismaService) {}

  listPendapatan(tahun?: number) {
    return this.prisma.pendapatan.findMany({
      where: tahun ? { tahun } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  createPendapatan(dto: CreatePendapatanDto) {
    return this.prisma.pendapatan.create({
      data: {
        tahun: dto.tahun,
        jenis: dto.jenis,
        nominal: dto.nominal,
        keterangan: dto.keterangan,
      },
    });
  }

  listBiaya(tahun?: number) {
    return this.prisma.biayaOperasional.findMany({
      where: tahun ? { tahun } : undefined,
      orderBy: { tanggal: 'desc' },
    });
  }

  createBiaya(dto: CreateBiayaDto) {
    return this.prisma.biayaOperasional.create({
      data: {
        tahun: dto.tahun,
        jenis: dto.jenis,
        nominal: dto.nominal,
        keterangan: dto.keterangan,
      },
    });
  }

  async ringkasanTahun(tahun: number) {
    const [pendapatan, beban] = await Promise.all([
      this.prisma.pendapatan.aggregate({
        where: { tahun },
        _sum: { nominal: true },
      }),
      this.prisma.biayaOperasional.aggregate({
        where: { tahun },
        _sum: { nominal: true },
      }),
    ]);

    const totalPendapatan = Number(pendapatan._sum.nominal ?? 0);
    const totalBeban = Number(beban._sum.nominal ?? 0);

    return {
      tahun,
      totalPendapatan,
      totalBeban,
      shuBersih: totalPendapatan - totalBeban,
    };
  }

  async getPeriodeShu(tahun: number) {
    const row = await this.prisma.periodeShu.findUnique({
      where: { tahun },
      include: {
        shuAnggota: {
          include: {
            anggota: { include: { pangkat: true, korps: true } },
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException(`Perhitungan SHU tahun ${tahun} belum ada`);
    }
    return row;
  }
}
