import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { toNumber } from '../common/utils/decimal.util';
import { StatusPinjaman } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: JwtUser) {
    const satminkalId = user.satminkalId;
    const currentYear = new Date().getFullYear();

    // 1. Total Anggota Aktif
    const totalAnggota = await this.prisma.anggota.count({
      where: { satminkalId, isAktif: true },
    });

    // 2. Total Simpanan
    const simpananRows = await this.prisma.simpanan.findMany({
      where: { anggota: { satminkalId } },
      select: { tipe: true, nominal: true },
    });
    const totalSimpanan = simpananRows.reduce((acc, row) => {
      const val = toNumber(row.nominal);
      return row.tipe === 'SETOR' ? acc + val : acc - val;
    }, 0);

    // 3. Total Pinjaman (Akumulasi disetujui / dicairkan)
    const pinjamanList = await this.prisma.pinjaman.findMany({
      where: {
        anggota: { satminkalId },
        status: { notIn: [StatusPinjaman.DITOLAK, StatusPinjaman.DIAJUKAN] },
      },
      select: { nominal: true, status: true, sisaPokok: true },
    });
    const totalPinjaman = pinjamanList.reduce(
      (acc, p) => acc + toNumber(p.nominal),
      0,
    );

    // 4. Pinjaman Berjalan (Status DICAIRKAN & sisaPokok > 0)
    const pinjamanBerjalanRows = pinjamanList.filter(
      (p) => p.status === StatusPinjaman.DICAIRKAN,
    );
    const totalPinjamanBerjalan = pinjamanBerjalanRows.reduce(
      (acc, p) => acc + toNumber(p.sisaPokok ?? p.nominal),
      0,
    );
    const countPinjamanBerjalan = pinjamanBerjalanRows.length;

    // 5. Pendapatan & Biaya Tahun Berjalan -> SHU Tahun Berjalan
    const aggregatePendapatan = await this.prisma.pendapatan.aggregate({
      where: { satminkalId, tahun: currentYear },
      _sum: { nominal: true },
    });
    const aggregateBiaya = await this.prisma.biayaOperasional.aggregate({
      where: { tahun: currentYear },
      _sum: { nominal: true },
    });

    const totalPendapatanYear = toNumber(aggregatePendapatan._sum.nominal ?? 0);
    const totalBiayaYear = toNumber(aggregateBiaya._sum.nominal ?? 0);
    const shuTahunBerjalan = totalPendapatanYear - totalBiayaYear;

    // 6. Estimasi Kas Koperasi (Kas = Simpanan + Angsuran Dibayar - Pinjaman Dicairkan + Pendapatan - Biaya Operasional)
    const totalAngsuranDibayarAgg = await this.prisma.angsuran.aggregate({
      where: {
        pinjaman: { anggota: { satminkalId } },
        dibayar: true,
      },
      _sum: { total: true },
    });
    const totalAngsuranDibayar = toNumber(totalAngsuranDibayarAgg._sum.total ?? 0);

    const totalPencairanAgg = await this.prisma.pinjaman.aggregate({
      where: {
        anggota: { satminkalId },
        status: { in: [StatusPinjaman.DICAIRKAN, StatusPinjaman.LUNAS] },
      },
      _sum: { nominal: true },
    });
    const totalPencairan = toNumber(totalPencairanAgg._sum.nominal ?? 0);

    const kasKoperasi =
      totalSimpanan + totalAngsuranDibayar - totalPencairan - totalBiayaYear;

    return {
      totalAnggota,
      totalSimpanan,
      totalPinjaman,
      totalPinjamanBerjalan,
      countPinjamanBerjalan,
      kasKoperasi,
      shuTahunBerjalan,
      tahun: currentYear,
    };
  }

  async getCharts(user: JwtUser, tahun?: number) {
    const targetYear = tahun || new Date().getFullYear();
    const satminkalId = user.satminkalId;

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    // Data Simpanan Bulanan per Bulan
    const simpananList = await this.prisma.simpanan.findMany({
      where: {
        anggota: { satminkalId },
        createdAt: {
          gte: new Date(`${targetYear}-01-01`),
          lt: new Date(`${targetYear + 1}-01-01`),
        },
      },
      select: { createdAt: true, nominal: true, tipe: true },
    });

    // Data Pinjaman Bulanan (pencairan)
    const pinjamanList = await this.prisma.pinjaman.findMany({
      where: {
        anggota: { satminkalId },
        tanggalCair: {
          gte: new Date(`${targetYear}-01-01`),
          lt: new Date(`${targetYear + 1}-01-01`),
        },
        status: { in: [StatusPinjaman.DICAIRKAN, StatusPinjaman.LUNAS] },
      },
      select: { tanggalCair: true, nominal: true },
    });

    // Data Angsuran Bulanan (pembayaran)
    const angsuranList = await this.prisma.angsuran.findMany({
      where: {
        pinjaman: { anggota: { satminkalId } },
        dibayar: true,
        tanggalBayar: {
          gte: new Date(`${targetYear}-01-01`),
          lt: new Date(`${targetYear + 1}-01-01`),
        },
      },
      select: { tanggalBayar: true, total: true },
    });

    const monthlyData = monthNames.map((name, index) => {
      const monthSimpanan = simpananList
        .filter((s) => new Date(s.createdAt).getMonth() === index)
        .reduce(
          (sum, s) =>
            s.tipe === 'SETOR'
              ? sum + toNumber(s.nominal)
              : sum - toNumber(s.nominal),
          0,
        );

      const monthPinjaman = pinjamanList
        .filter(
          (p) => p.tanggalCair && new Date(p.tanggalCair).getMonth() === index,
        )
        .reduce((sum, p) => sum + toNumber(p.nominal), 0);

      const monthAngsuran = angsuranList
        .filter(
          (a) => a.tanggalBayar && new Date(a.tanggalBayar).getMonth() === index,
        )
        .reduce((sum, a) => sum + toNumber(a.total), 0);

      return {
        bulan: name,
        bulanIndex: index + 1,
        simpanan: monthSimpanan,
        pinjaman: monthPinjaman,
        angsuran: monthAngsuran,
      };
    });

    return {
      tahun: targetYear,
      data: monthlyData,
    };
  }
}
