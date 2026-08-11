import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Injectable()
export class BackupService {
  constructor(private readonly prisma: PrismaService) {}

  async exportData(user: JwtUser) {
    const satminkalId = user.satminkalId;

    const [
      kotama,
      satminkal,
      pangkat,
      korps,
      users,
      anggota,
      simpanan,
      pinjaman,
      angsuran,
      pendapatan,
      biayaOperasional,
      kopstuk,
      tajukTtd,
    ] = await Promise.all([
      this.prisma.kotama.findMany(),
      this.prisma.satminkal.findMany(),
      this.prisma.pangkat.findMany(),
      this.prisma.korps.findMany(),
      this.prisma.user.findMany({ select: { id: true, username: true, role: true, namaLengkap: true, kotamaId: true, satminkalId: true, isActive: true } }),
      this.prisma.anggota.findMany({ where: { satminkalId } }),
      this.prisma.simpanan.findMany({ where: { anggota: { satminkalId } } }),
      this.prisma.pinjaman.findMany({ where: { anggota: { satminkalId } } }),
      this.prisma.angsuran.findMany({ where: { pinjaman: { anggota: { satminkalId } } } }),
      this.prisma.pendapatan.findMany({ where: { satminkalId } }),
      this.prisma.biayaOperasional.findMany(),
      this.prisma.kopstuk.findMany({ where: { satminkalId } }),
      this.prisma.tajukTandaTangan.findMany(),
    ]);

    return {
      appName: 'Casheva Koperasi Simpan Pinjam TNI AD',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      satminkalId,
      data: {
        kotama,
        satminkal,
        pangkat,
        korps,
        users,
        anggota,
        simpanan,
        pinjaman,
        angsuran,
        pendapatan,
        biayaOperasional,
        kopstuk,
        tajukTtd,
      },
    };
  }

  async restoreData(user: JwtUser, payload: any) {
    if (!payload || !payload.data) {
      throw new BadRequestException('Format file restore tidak valid');
    }

    const data = payload.data;
    let restoredCount = 0;

    // Restore anggota jika ada
    if (Array.isArray(data.anggota)) {
      for (const a of data.anggota) {
        if (a.id && a.nrpNip) {
          await this.prisma.anggota.upsert({
            where: { id: a.id },
            create: {
              id: a.id,
              nama: a.nama,
              nrpNip: a.nrpNip,
              pangkatId: a.pangkatId,
              korpsId: a.korpsId,
              satminkalId: a.satminkalId || user.satminkalId,
              isAktif: a.isAktif ?? true,
            },
            update: {
              nama: a.nama,
              isAktif: a.isAktif,
            },
          });
          restoredCount++;
        }
      }
    }

    return {
      message: 'Restore data berhasil diproses',
      totalAnggotaRestored: restoredCount,
      timestamp: new Date().toISOString(),
    };
  }
}
