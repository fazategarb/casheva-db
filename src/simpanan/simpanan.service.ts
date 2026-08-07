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

    // Ambil seluruh data simpanan anggota di Satminkal ini
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

  async sukarelaMassal(user: JwtUser, dto: SimpananMassalDto) {
    const periode = this.normalizeTanggal5(dto.periode);

    const anggotaList = await this.prisma.anggota.findMany({
      where: { satminkalId: user.satminkalId, isAktif: true },
      include: { pangkat: true },
    });

    if (anggotaList.length === 0) {
      throw new BadRequestException('Tidak ada anggota aktif');
    }

    let created = 0;
    let skipped = 0;

    for (const anggota of anggotaList) {
      const dup = await this.prisma.simpanan.findFirst({
        where: {
          anggotaId: anggota.id,
          jenis: JenisSimpanan.SUKARELA,
          periode,
        },
      });
      if (dup) {
        skipped += 1;
        continue;
      }

      const nominal = this.sukarelaNominal(anggota.pangkat.kategori);
      await this.prisma.simpanan.create({
        data: {
          anggotaId: anggota.id,
          jenis: JenisSimpanan.SUKARELA,
          tipe: JenisTransaksiSimpanan.SETOR,
          nominal: decimal(nominal),
          periode,
          keterangan: `Potong sukarela ${periode.toISOString().slice(0, 7)}`,
        },
      });
      created += 1;
    }

    return {
      periode: periode.toISOString().slice(0, 10),
      created,
      skipped,
      totalAnggota: anggotaList.length,
    };
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
