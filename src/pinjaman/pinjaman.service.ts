import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusPinjaman } from '@prisma/client';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import {
  hitungJadwalAngsuran,
  validasiPinjaman,
} from '../common/utils/pinjaman-calculator';
import { decimal, toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CairkanPinjamanDto,
  CreatePinjamanDto,
  UpdateStatusPinjamanDto,
} from './dto/pinjaman.dto';

const pinjamanInclude = {
  anggota: { include: { pangkat: true, korps: true } },
  angsuran: { orderBy: { bulanKe: 'asc' as const } },
} as const;

const ALLOWED_TRANSITIONS: Partial<
  Record<StatusPinjaman, StatusPinjaman[]>
> = {
  [StatusPinjaman.DIAJUKAN]: [
    StatusPinjaman.VERIFIKASI_PRIMKOP,
    StatusPinjaman.DITOLAK,
  ],
  [StatusPinjaman.VERIFIKASI_PRIMKOP]: [
    StatusPinjaman.VERIFIKASI_JURU_BAYAR,
    StatusPinjaman.DITOLAK,
  ],
  [StatusPinjaman.VERIFIKASI_JURU_BAYAR]: [
    StatusPinjaman.REKOMENDASI_PIMPINAN,
    StatusPinjaman.DITOLAK,
  ],
  [StatusPinjaman.REKOMENDASI_PIMPINAN]: [
    StatusPinjaman.SETUJU_KAPRIM,
    StatusPinjaman.DITOLAK,
  ],
  [StatusPinjaman.SETUJU_KAPRIM]: [
    StatusPinjaman.MENUNGGU_DOKUMEN,
    StatusPinjaman.DITOLAK,
  ],
  [StatusPinjaman.MENUNGGU_DOKUMEN]: [StatusPinjaman.DICAIRKAN],
};

@Injectable()
export class PinjamanService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: JwtUser, status?: StatusPinjaman) {
    return this.prisma.pinjaman.findMany({
      where: {
        anggota: { satminkalId: user.satminkalId },
        ...(status ? { status } : {}),
      },
      include: pinjamanInclude,
      orderBy: { tanggalAjuan: 'desc' },
    });
  }

  async findOne(user: JwtUser, id: string) {
    const row = await this.prisma.pinjaman.findFirst({
      where: { id, anggota: { satminkalId: user.satminkalId } },
      include: pinjamanInclude,
    });
    if (!row) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }
    return row;
  }

  async create(user: JwtUser, dto: CreatePinjamanDto) {
    const err = validasiPinjaman(dto.nominal, dto.tenorBulan);
    if (err) {
      throw new BadRequestException(err);
    }

    const anggota = await this.prisma.anggota.findFirst({
      where: { id: dto.anggotaId, satminkalId: user.satminkalId, isAktif: true },
    });
    if (!anggota) {
      throw new NotFoundException('Anggota aktif tidak ditemukan');
    }

    return this.prisma.pinjaman.create({
      data: {
        anggotaId: dto.anggotaId,
        nominal: decimal(dto.nominal),
        tenorBulan: dto.tenorBulan,
        bungaPersenTahun: decimal(12),
        status: StatusPinjaman.DIAJUKAN,
      },
      include: pinjamanInclude,
    });
  }

  async updateStatus(
    user: JwtUser,
    id: string,
    dto: UpdateStatusPinjamanDto,
  ) {
    const pinjaman = await this.findOne(user, id);
    const next = dto.status as StatusPinjaman;
    const allowed = ALLOWED_TRANSITIONS[pinjaman.status] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transisi status dari ${pinjaman.status} ke ${next} tidak diizinkan`,
      );
    }

    return this.prisma.pinjaman.update({
      where: { id },
      data: { status: next },
      include: pinjamanInclude,
    });
  }

  async cairkan(user: JwtUser, id: string, dto: CairkanPinjamanDto) {
    const pinjaman = await this.findOne(user, id);
    if (pinjaman.status !== StatusPinjaman.MENUNGGU_DOKUMEN) {
      throw new BadRequestException(
        'Pinjaman harus berstatus MENUNGGU_DOKUMEN sebelum pencairan',
      );
    }
    if (pinjaman.angsuran.length > 0) {
      throw new BadRequestException('Jadwal angsuran sudah dibuat');
    }

    const nominal = toNumber(pinjaman.nominal);
    const jadwal = hitungJadwalAngsuran(nominal, pinjaman.tenorBulan);
    const tanggalCair = dto.tanggalCair
      ? new Date(dto.tanggalCair)
      : new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.angsuran.createMany({
        data: jadwal.map((row) => {
          const jatuh = new Date(tanggalCair);
          jatuh.setMonth(jatuh.getMonth() + row.bulanKe);
          jatuh.setDate(5);
          return {
            pinjamanId: id,
            bulanKe: row.bulanKe,
            jatuhTempo: jatuh,
            pokok: decimal(row.pokok),
            bunga: decimal(row.bunga),
            total: decimal(row.total),
          };
        }),
      });

      return tx.pinjaman.update({
        where: { id },
        data: {
          status: StatusPinjaman.DICAIRKAN,
          tanggalCair,
          sisaPokok: decimal(nominal),
        },
        include: pinjamanInclude,
      });
    });
  }

  async bayarAngsuran(user: JwtUser, angsuranId: string) {
    const angsuran = await this.prisma.angsuran.findFirst({
      where: {
        id: angsuranId,
        pinjaman: { anggota: { satminkalId: user.satminkalId } },
      },
      include: {
        pinjaman: true,
      },
    });
    if (!angsuran) {
      throw new NotFoundException('Angsuran tidak ditemukan');
    }
    if (angsuran.dibayar) {
      throw new BadRequestException('Angsuran sudah dibayar');
    }

    const satminkal = await this.prisma.satminkal.findUniqueOrThrow({
      where: { id: user.satminkalId },
    });
    const tahun = new Date().getFullYear();
    const noInvoice = await this.generateInvoice(user.satminkalId, satminkal.kode, tahun);

    const updated = await this.prisma.$transaction(async (tx) => {
      const paid = await tx.angsuran.update({
        where: { id: angsuranId },
        data: {
          dibayar: true,
          tanggalBayar: new Date(),
          noInvoice,
        },
      });

      const sisa =
        toNumber(angsuran.pinjaman.sisaPokok ?? angsuran.pinjaman.nominal) -
        toNumber(angsuran.pokok);
      const sisaFinal = Math.max(0, sisa);

      const unpaid = await tx.angsuran.count({
        where: { pinjamanId: angsuran.pinjamanId, dibayar: false },
      });

      await tx.pinjaman.update({
        where: { id: angsuran.pinjamanId },
        data: {
          sisaPokok: decimal(sisaFinal),
          ...(unpaid === 0 ? { status: StatusPinjaman.LUNAS } : {}),
        },
      });

      await tx.pendapatan.create({
        data: {
          tahun,
          jenis: 'BUNGA_PINJAMAN',
          nominal: angsuran.bunga,
          keterangan: `Bunga angsuran ke-${angsuran.bulanKe} pinjaman ${angsuran.pinjamanId}`,
        },
      });

      return paid;
    });

    return updated;
  }

  private async generateInvoice(
    satminkalId: string,
    kodeSatker: string,
    tahun: number,
  ): Promise<string> {
    const count = await this.prisma.angsuran.count({
      where: {
        noInvoice: { not: null },
        pinjaman: { anggota: { satminkalId } },
        tanggalBayar: {
          gte: new Date(`${tahun}-01-01`),
          lt: new Date(`${tahun + 1}-01-01`),
        },
      },
    });
    const seq = String(count + 1).padStart(6, '0');
    return `KW-${tahun}-${kodeSatker}-${seq}`;
  }
}
