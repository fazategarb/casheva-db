import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JenisSimpanan,
  JenisTransaksiSimpanan,
  KategoriPangkat,
} from '@prisma/client';
import {
  SIMPANAN_POKOK,
  SIMPANAN_WAJIB,
  SUKARELA_BY_KATEGORI,
} from '../common/constants/simpanan.constants';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { decimal, toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import { SimpananMassalDto } from './dto/simpanan-massal.dto';

@Injectable()
export class SimpananService {
  constructor(private readonly prisma: PrismaService) {}

  async listByAnggota(user: JwtUser, anggotaId: string) {
    await this.assertAnggotaScope(user, anggotaId);
    return this.prisma.simpanan.findMany({
      where: { anggotaId },
      orderBy: [{ periode: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async rekapSatminkal(user: JwtUser) {
    const anggota = await this.prisma.anggota.findMany({
      where: { satminkalId: user.satminkalId, isAktif: true },
      select: { id: true, nama: true, nrpNip: true },
    });
    const ids = anggota.map((a) => a.id);

    const simpananList = await this.prisma.simpanan.findMany({
      where: { anggotaId: { in: ids } },
      select: { anggotaId: true, jenis: true, tipe: true, nominal: true },
    });

    return anggota.map((a) => {
      const userRows = simpananList.filter((s) => s.anggotaId === a.id);

      const calculateTotal = (jenis: JenisSimpanan) => {
        return userRows
          .filter((r) => r.jenis === jenis)
          .reduce((acc, curr) => {
            const val = toNumber(curr.nominal);
            return curr.tipe === JenisTransaksiSimpanan.SETOR
              ? acc + val
              : acc - val;
          }, 0);
      };

      const totalPokok = calculateTotal(JenisSimpanan.POKOK);
      const totalWajib = calculateTotal(JenisSimpanan.WAJIB);
      const totalSukarela = calculateTotal(JenisSimpanan.SUKARELA);

      return {
        ...a,
        totalPokok,
        totalWajib,
        totalSukarela,
        totalSimpanan: totalPokok + totalWajib + totalSukarela,
      };
    });
  }

  async setPokokWajib(user: JwtUser, anggotaId: string) {
    const anggota = await this.assertAnggotaScope(user, anggotaId);

    const existing = await this.prisma.simpanan.count({
      where: {
        anggotaId,
        jenis: { in: [JenisSimpanan.POKOK, JenisSimpanan.WAJIB] },
      },
    });
    if (existing > 0) {
      throw new BadRequestException(
        'Simpanan pokok/wajib sudah pernah dicatat untuk anggota ini',
      );
    }

    await this.prisma.simpanan.createMany({
      data: [
        {
          anggotaId,
          jenis: JenisSimpanan.POKOK,
          tipe: JenisTransaksiSimpanan.SETOR,
          nominal: decimal(SIMPANAN_POKOK),
          keterangan: 'Simpanan pokok awal',
        },
        {
          anggotaId,
          jenis: JenisSimpanan.WAJIB,
          tipe: JenisTransaksiSimpanan.SETOR,
          nominal: decimal(SIMPANAN_WAJIB),
          keterangan: 'Simpanan wajib awal',
        },
      ],
    });

    return {
      message: 'Simpanan pokok & wajib berhasil dicatat',
      anggota: anggota.nama,
      pokok: SIMPANAN_POKOK,
      wajib: SIMPANAN_WAJIB,
    };
  }

  // Optimasi Batch Insert (Mencegah N+1 Query)
  async sukarelaMassal(user: JwtUser, dto: SimpananMassalDto) {
    const periode = this.normalizeTanggal5(dto.periode);

    const anggotaList = await this.prisma.anggota.findMany({
      where: { satminkalId: user.satminkalId, isAktif: true },
      include: { pangkat: true },
    });

    if (anggotaList.length === 0) {
      throw new BadRequestException('Tidak ada anggota aktif');
    }

    const anggotaIds = anggotaList.map((a) => a.id);

    // Fetch seluruh transaksi sukarela periode ini dalam 1 query
    const existingSimpanan = await this.prisma.simpanan.findMany({
      where: {
        anggotaId: { in: anggotaIds },
        jenis: JenisSimpanan.SUKARELA,
        periode,
      },
      select: { anggotaId: true },
    });

    const existingAnggotaSet = new Set(
      existingSimpanan.map((s) => s.anggotaId),
    );

    const newEntries = anggotaList
      .filter((anggota) => !existingAnggotaSet.has(anggota.id))
      .map((anggota) => ({
        anggotaId: anggota.id,
        jenis: JenisSimpanan.SUKARELA,
        tipe: JenisTransaksiSimpanan.SETOR,
        nominal: decimal(this.sukarelaNominal(anggota.pangkat.kategori)),
        periode,
        keterangan: `Potong sukarela ${periode.toISOString().slice(0, 7)}`,
      }));

    if (newEntries.length > 0) {
      await this.prisma.simpanan.createMany({
        data: newEntries,
      });
    }

    return {
      periode: periode.toISOString().slice(0, 10),
      created: newEntries.length,
      skipped: anggotaList.length - newEntries.length,
      totalAnggota: anggotaList.length,
    };
  }

  // Penarikan Simpanan Sukarela dengan Validasi Saldo
  async tarikSukarela(
    user: JwtUser,
    anggotaId: string,
    nominal: number,
    keterangan?: string,
  ) {
    await this.assertAnggotaScope(user, anggotaId);

    if (nominal <= 0) {
      throw new BadRequestException('Nominal penarikan harus lebih dari 0');
    }

    const simpananRows = await this.prisma.simpanan.findMany({
      where: { anggotaId, jenis: JenisSimpanan.SUKARELA },
      select: { tipe: true, nominal: true },
    });

    const totalSaldoSukarela = simpananRows.reduce((acc, curr) => {
      const val = toNumber(curr.nominal);
      return curr.tipe === JenisTransaksiSimpanan.SETOR ? acc + val : acc - val;
    }, 0);

    if (totalSaldoSukarela < nominal) {
      throw new BadRequestException(
        `Saldo simpanan sukarela tidak mencukupi. Saldo saat ini: Rp ${totalSaldoSukarela.toLocaleString('id-ID')}`,
      );
    }

    return this.prisma.simpanan.create({
      data: {
        anggotaId,
        jenis: JenisSimpanan.SUKARELA,
        tipe: JenisTransaksiSimpanan.TARIK,
        nominal: decimal(nominal),
        keterangan: keterangan ?? 'Penarikan simpanan sukarela',
      },
    });
  }

  private sukarelaNominal(kategori: KategoriPangkat): number {
    return SUKARELA_BY_KATEGORI[kategori];
  }

  private normalizeTanggal5(isoDate: string): Date {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Format periode tidak valid');
    }
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 5));
  }

  private async assertAnggotaScope(user: JwtUser, anggotaId: string) {
    const anggota = await this.prisma.anggota.findFirst({
      where: { id: anggotaId, satminkalId: user.satminkalId },
    });
    if (!anggota) {
      throw new NotFoundException('Anggota tidak ditemukan di Satminkal Anda');
    }
    return anggota;
  }
}
