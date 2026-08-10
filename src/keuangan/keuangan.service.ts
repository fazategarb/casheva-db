import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBiayaDto,
  CreatePendapatanDto,
  HitungShuDto,
} from './dto/keuangan.dto';
import { JwtUser } from 'src/common/interfaces/jwt-user.interface';

@Injectable()
export class KeuanganService {
  constructor(private readonly prisma: PrismaService) {}

  async createPendapatan(user: JwtUser, dto: CreatePendapatanDto) {
    return this.prisma.pendapatan.create({
      data: {
        ...dto,
        satminkalId: user.satminkalId,
      },
    });
  }

  async listPendapatan(user: JwtUser, tahun?: number) {
    return this.prisma.pendapatan.findMany({
      where: {
        satminkalId: user.satminkalId,
        ...(tahun && { tahun }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBiaya(dto: CreateBiayaDto) {
    return this.prisma.biayaOperasional.create({
      data: {
        ...dto,
      },
    });
  }

  async listBiaya(tahun?: number) {
    return this.prisma.biayaOperasional.findMany({
      where: {
        ...(tahun && { tahun }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async ringkasanTahun(user: JwtUser, tahun: number) {
    const aggregatePendapatan = await this.prisma.pendapatan.aggregate({
      where: {
        satminkalId: user.satminkalId,
        tahun,
      },
      _sum: { nominal: true },
    });

    const aggregateBiaya = await this.prisma.biayaOperasional.aggregate({
      where: {
        tahun,
      },
      _sum: { nominal: true },
    });

    const totalPendapatan = Number(aggregatePendapatan._sum?.nominal ?? 0);
    const totalBeban = Number(aggregateBiaya._sum?.nominal ?? 0);

    return {
      tahun,
      satminkalId: user.satminkalId,
      totalPendapatan,
      totalBeban,
      shuBersih: totalPendapatan - totalBeban,
    };
  }

  async hitungDanSimpanShu(user: JwtUser, dto: HitungShuDto) {
    const {
      tahun,
      persenJasaModal,
      persenJasaUsaha,
      persenCadangan,
      persenPengurus,
      persenSosialPendidikan = 0,
    } = dto;

    const ringkasan = await this.ringkasanTahun(user, tahun);
    if (ringkasan.shuBersih <= 0) {
      throw new BadRequestException(
        `SHU Bersih tahun ${tahun} tidak memenuhi syarat pembagian (<= 0).`,
      );
    }

    const { shuBersih, totalPendapatan, totalBeban } = ringkasan;

    // Kalkulasi alokasi SHU
    const alokasiJasaModal = (shuBersih * persenJasaModal) / 100;
    const alokasiJasaUsaha = (shuBersih * persenJasaUsaha) / 100;

    return this.prisma.$transaction(async (tx) => {
      // 1. Simpan atau Update Periode SHU
      const periodeShu = await tx.periodeShu.upsert({
        where: { tahun },
        update: {
          totalPendapatan,
          totalBeban,
          shuBersih,
          cadangan: (shuBersih * persenCadangan) / 100,
          jasaModal: alokasiJasaModal,
          jasaUsaha: alokasiJasaUsaha,
          pengurus: (shuBersih * persenPengurus) / 100,
          sosialPendidikan: (shuBersih * persenSosialPendidikan) / 100,
        },
        create: {
          tahun,
          totalPendapatan,
          totalBeban,
          shuBersih,
          cadangan: (shuBersih * persenCadangan) / 100,
          jasaModal: alokasiJasaModal,
          jasaUsaha: alokasiJasaUsaha,
          pengurus: (shuBersih * persenPengurus) / 100,
          sosialPendidikan: (shuBersih * persenSosialPendidikan) / 100,
        },
      });

      // 2. Ambil akumulasi simpanan dan bunga pinjaman di Satminkal ini
      const simpananAgg = await tx.simpanan.aggregate({
        where: {
          anggota: { satminkalId: user.satminkalId },
          tipe: 'SETOR',
        },
        _sum: { nominal: true },
      });

      const angsuranAgg = await tx.angsuran.aggregate({
        where: {
          pinjaman: { anggota: { satminkalId: user.satminkalId } },
          dibayar: true,
        },
        _sum: { bunga: true },
      });

      const totalSimpananSatminkal =
        Number(simpananAgg._sum?.nominal ?? 0) || 1;
      const totalBungaPinjamanSatminkal =
        Number(angsuranAgg._sum?.bunga ?? 0) || 1;

      // 3. Ambil seluruh Anggota aktif di Satminkal
      const anggotaList = await tx.anggota.findMany({
        where: {
          satminkalId: user.satminkalId,
          isAktif: true,
        },
        include: {
          simpanan: true,
          pinjaman: {
            include: {
              angsuran: {
                where: { dibayar: true },
              },
            },
          },
        },
      });

      // 4. Hitung rincian per Anggota
      const shuAnggotaData = anggotaList.map((anggota) => {
        const totalSimpananAnggota = anggota.simpanan.reduce(
          (acc: number, curr: { nominal: unknown; tipe: string }) => {
            const nominal = Number(curr.nominal);
            return curr.tipe === 'TARIK' ? acc - nominal : acc + nominal;
          },
          0,
        );

        const totalBungaAnggota = anggota.pinjaman.reduce(
          (
            accPinjaman: number,
            currPinjaman: { angsuran: { bunga: unknown }[] },
          ) =>
            accPinjaman +
            currPinjaman.angsuran.reduce(
              (accAngsuran: number, currAngsuran: { bunga: unknown }) =>
                accAngsuran + Number(currAngsuran.bunga),
              0,
            ),
          0,
        );

        const jasaModal =
          (Math.max(0, totalSimpananAnggota) / totalSimpananSatminkal) *
          alokasiJasaModal;
        const jasaUsaha =
          (totalBungaAnggota / totalBungaPinjamanSatminkal) * alokasiJasaUsaha;

        return {
          periodeShuId: periodeShu.id,
          anggotaId: anggota.id,
          jasaModal,
          jasaUsaha,
          total: jasaModal + jasaUsaha,
        };
      });

      // Hapus data lama jika re-kalkulasi pernah dilakukan untuk periode ini
      await tx.shuAnggota.deleteMany({
        where: { periodeShuId: periodeShu.id },
      });

      await tx.shuAnggota.createMany({
        data: shuAnggotaData,
      });

      return periodeShu;
    });
  }

  async getPeriodeShu(tahun: number) {
    const result = await this.prisma.periodeShu.findUnique({
      where: {
        tahun,
      },
      include: {
        shuAnggota: {
          include: {
            anggota: {
              select: {
                id: true,
                nama: true,
                nrpNip: true,
                pangkat: {
                  select: { nama: true },
                },
                korps: {
                  select: { nama: true },
                },
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException(`Data SHU tahun ${tahun} tidak ditemukan`);
    }

    return result;
  }
}
