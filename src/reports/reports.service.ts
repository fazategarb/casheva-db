import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { hitungJadwalAngsuran } from '../common/utils/pinjaman-calculator';
import { toNumber } from '../common/utils/decimal.util';
import { StatusPinjaman } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getKopstukAndTajuk(satminkalId: string, kategoriTtd?: string) {
    const kopstuk = await this.prisma.kopstuk.findFirst({
      where: { satminkalId },
    });

    const tajuk = await this.prisma.tajukTandaTangan.findFirst({
      where: {
        isAktif: true,
        ...(kategoriTtd ? { kategori: kategoriTtd } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      kopstuk: kopstuk || {
        namaSatuan: 'MARKAS BESAR ANGKATAN DARAT',
        namaBalak: 'DINAS INFORMASI DAN PENGOLAHAN DATA',
        alamat: 'Jl. Veteran No. 5, Jakarta Pusat',
        nomorTelepon: '021-3840123',
      },
      tajukTtd: tajuk || {
        jabatan: 'Kasubdistekinfo Selaku Kalakgiat',
        namaPejabat: 'Sigit Suhendro Hadi K., S.T., M.Tr.(Han)',
        pangkat: 'Kolonel Inf',
        nrp: '11020019460278',
      },
    };
  }

  // 1. Data Anggota Koperasi (Lampiran II)
  async getReportAnggota(user: JwtUser) {
    const satminkalId = user.satminkalId;
    const headerInfo = await this.getKopstukAndTajuk(satminkalId);

    const anggota = await this.prisma.anggota.findMany({
      where: { satminkalId },
      include: {
        pangkat: true,
        korps: true,
        satminkal: { include: { kotama: true } },
      },
      orderBy: { nama: 'asc' },
    });

    return {
      title: 'DAFTAR ANGGOTA KOPERASI',
      ...headerInfo,
      data: anggota.map((a, i) => ({
        no: i + 1,
        id: a.id,
        nama: a.nama,
        pktCrpNrp: `${a.pangkat.nama} ${a.korps.nama} / ${a.nrpNip}`,
        pangkat: a.pangkat.nama,
        korps: a.korps.nama,
        nrpNip: a.nrpNip,
        kesatuan: a.satminkal.nama,
        tmtAnggota: a.tmtAnggota ? a.tmtAnggota.toISOString().slice(0, 10) : '-',
        status: a.isAktif ? 'AKTIF' : 'TIDAK AKTIF',
      })),
    };
  }

  // 2. Brosur Pinjaman (Lampiran III)
  async getBrosurPinjaman() {
    const nominalList = [
      1000000, 2000000, 3000000, 4000000, 5000000, 6000000, 7000000, 8000000,
      9000000, 10000000, 11000000, 12000000, 13000000, 14000000, 15000000,
      16000000, 17000000, 18000000, 19000000, 20000000,
    ];
    const tenors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 30, 36];

    const matrix = tenors.map((tenor) => {
      const row: Record<string, number> = { tenorBulan: tenor };
      for (const nominal of nominalList) {
        const schedule = hitungJadwalAngsuran(nominal, tenor);
        row[`rp_${nominal}`] = schedule[0]?.total || 0;
      }
      return row;
    });

    return {
      title: 'BROSUR PINJAMAN PRIMKOP',
      bunga: '12% per tahun (1% per bulan)',
      nominalList,
      matrix,
    };
  }

  // 3. Rekap Simpanan Anggota (Lampiran IV)
  async getRekapSimpanan(user: JwtUser) {
    const satminkalId = user.satminkalId;
    const headerInfo = await this.getKopstukAndTajuk(satminkalId);

    const anggotaList = await this.prisma.anggota.findMany({
      where: { satminkalId, isAktif: true },
      include: { pangkat: true, korps: true, satminkal: true },
      orderBy: { nama: 'asc' },
    });

    const simpananRows = await this.prisma.simpanan.findMany({
      where: { anggota: { satminkalId } },
      select: { anggotaId: true, jenis: true, tipe: true, nominal: true },
    });

    let totalGlobalPokok = 0;
    let totalGlobalWajib = 0;
    let totalGlobalSukarela = 0;

    const data = anggotaList.map((a, i) => {
      const userSimpanan = simpananRows.filter((s) => s.anggotaId === a.id);

      const calc = (jenisStr: string) =>
        userSimpanan
          .filter((s) => s.jenis === jenisStr)
          .reduce(
            (acc, curr) =>
              curr.tipe === 'SETOR'
                ? acc + toNumber(curr.nominal)
                : acc - toNumber(curr.nominal),
            0,
          );

      const pokok = calc('POKOK');
      const wajib = calc('WAJIB');
      const sukarela = calc('SUKARELA');
      const total = pokok + wajib + sukarela;

      totalGlobalPokok += pokok;
      totalGlobalWajib += wajib;
      totalGlobalSukarela += sukarela;

      return {
        no: i + 1,
        nama: a.nama,
        pktCrpNrp: `${a.pangkat.nama} ${a.korps.nama} / ${a.nrpNip}`,
        kesatuan: a.satminkal.nama,
        simpananWajib: wajib,
        simpananPokok: pokok,
        simpananSukarela: sukarela,
        totalSimpanan: total,
      };
    });

    return {
      title: 'DAFTAR / REKAP SIMPANAN ANGGOTA',
      ...headerInfo,
      summary: {
        totalPokok: totalGlobalPokok,
        totalWajib: totalGlobalWajib,
        totalSukarela: totalGlobalSukarela,
        totalGlobal: totalGlobalPokok + totalGlobalWajib + totalGlobalSukarela,
      },
      data,
    };
  }

  // 4. Data Anggota Meminjam (Lampiran V)
  async getPinjamanAnggota(user: JwtUser, tahun?: number) {
    const satminkalId = user.satminkalId;
    const targetTahun = tahun || new Date().getFullYear();
    const headerInfo = await this.getKopstukAndTajuk(satminkalId);

    const pinjamanList = await this.prisma.pinjaman.findMany({
      where: {
        anggota: { satminkalId },
        status: { in: [StatusPinjaman.DICAIRKAN, StatusPinjaman.LUNAS] },
        tanggalCair: {
          gte: new Date(`${targetTahun}-01-01`),
          lt: new Date(`${targetTahun + 1}-01-01`),
        },
      },
      include: { anggota: { include: { pangkat: true, korps: true, satminkal: true } } },
      orderBy: { tanggalCair: 'desc' },
    });

    const data = pinjamanList.map((p, i) => {
      const tglMulai = p.tanggalCair
        ? p.tanggalCair.toISOString().slice(0, 7)
        : '-';
      const tglSelesai = p.tanggalCair
        ? new Date(
            p.tanggalCair.getFullYear(),
            p.tanggalCair.getMonth() + p.tenorBulan,
            1,
          )
            .toISOString()
            .slice(0, 7)
        : '-';

      return {
        no: i + 1,
        nama: p.anggota.nama,
        pktCrpNrp: `${p.anggota.pangkat.nama} ${p.anggota.korps.nama} / ${p.anggota.nrpNip}`,
        kesatuan: p.anggota.satminkal.nama,
        jumlahPinjaman: toNumber(p.nominal),
        jkaWkt: p.tenorBulan,
        angsuranMulai: tglMulai,
        angsuranSelesai: tglSelesai,
        tglAkad: p.tanggalCair ? p.tanggalCair.toISOString().slice(0, 10) : '-',
        status: p.status,
      };
    });

    return {
      title: `DAFTAR ANGGOTA YANG MEMINJAM KOPERASI TAHUN ${targetTahun}`,
      ...headerInfo,
      data,
    };
  }

  // 5. Resume / Akad Kredit (Lampiran VI)
  async getAkadKredit(user: JwtUser, pinjamanId: string) {
    const satminkalId = user.satminkalId;
    const headerInfo = await this.getKopstukAndTajuk(satminkalId, 'AKAD_KREDIT');

    const pinjaman = await this.prisma.pinjaman.findFirst({
      where: { id: pinjamanId, anggota: { satminkalId } },
      include: {
        anggota: { include: { pangkat: true, korps: true, satminkal: true } },
        angsuran: { orderBy: { bulanKe: 'asc' } },
      },
    });

    if (!pinjaman) {
      throw new NotFoundException('Data pinjaman tidak ditemukan');
    }

    const nominal = toNumber(pinjaman.nominal);
    const jadwal =
      pinjaman.angsuran.length > 0
        ? pinjaman.angsuran.map((a) => ({
            periode: a.bulanKe,
            bulan: a.jatuhTempo.toISOString().slice(0, 7),
            pokok: toNumber(a.pokok),
            bunga: toNumber(a.bunga),
            angsuranPerBulan: toNumber(a.total),
            dibayar: a.dibayar,
            noInvoice: a.noInvoice,
          }))
        : hitungJadwalAngsuran(nominal, pinjaman.tenorBulan).map((j) => ({
            periode: j.bulanKe,
            bulan: `Bulan ke-${j.bulanKe}`,
            pokok: j.pokok,
            bunga: j.bunga,
            angsuranPerBulan: j.total,
            dibayar: false,
            noInvoice: null,
          }));

    return {
      title: 'RESUME / AKAD KREDIT',
      ...headerInfo,
      peminjam: {
        nama: pinjaman.anggota.nama,
        pangkatKorpsNrp: `${pinjaman.anggota.pangkat.nama} ${pinjaman.anggota.korps.nama} / ${pinjaman.anggota.nrpNip}`,
        kesatuan: pinjaman.anggota.satminkal.nama,
        plafonPinjaman: nominal,
        jangkaWaktu: `${pinjaman.tenorBulan} BULAN`,
        sukuBungaTahunan: `${toNumber(pinjaman.bungaPersenTahun)}%`,
        sukuBungaBulanan: '1%',
        angsuranPerBulan: jadwal[0]?.angsuranPerBulan || 0,
        tanggalPeminjaman: pinjaman.tanggalCair
          ? pinjaman.tanggalCair.toISOString().slice(0, 10)
          : pinjaman.tanggalAjuan.toISOString().slice(0, 10),
      },
      jadwalAngsuran: jadwal,
    };
  }

  // 6. Kwitansi / Invoice (Lampiran VII)
  async getKwitansi(user: JwtUser, angsuranId: string) {
    const satminkalId = user.satminkalId;
    const headerInfo = await this.getKopstukAndTajuk(satminkalId, 'KWITANSI');

    const angsuran = await this.prisma.angsuran.findFirst({
      where: { id: angsuranId, pinjaman: { anggota: { satminkalId } } },
      include: {
        pinjaman: {
          include: {
            anggota: { include: { pangkat: true, korps: true, satminkal: true } },
          },
        },
      },
    });

    if (!angsuran) {
      throw new NotFoundException('Kwitansi angsuran tidak ditemukan');
    }

    return {
      title: 'KWITANSI / INVOICE',
      ...headerInfo,
      kwitansi: {
        noKwitansi: angsuran.noInvoice || `#INV-${angsuran.id.slice(0, 8)}`,
        noTransaksi: angsuran.id,
        nama: angsuran.pinjaman.anggota.nama,
        pangkatKorpsNrp: `${angsuran.pinjaman.anggota.pangkat.nama} ${angsuran.pinjaman.anggota.korps.nama} / ${angsuran.pinjaman.anggota.nrpNip}`,
        kesatuan: angsuran.pinjaman.anggota.satminkal.nama,
        plafonPinjaman: toNumber(angsuran.pinjaman.nominal),
        jangkaWaktu: `${angsuran.pinjaman.tenorBulan} BULAN`,
        angsuranKe: `${angsuran.bulanKe} / ${angsuran.pinjaman.tenorBulan}`,
        jatuhTempo: angsuran.jatuhTempo.toISOString().slice(0, 10),
        tanggalPembayaran: angsuran.tanggalBayar
          ? angsuran.tanggalBayar.toISOString().slice(0, 10)
          : '-',
        angsuranPerBulan: toNumber(angsuran.total),
        administrasi: toNumber(angsuran.biayaAdmin),
        jumlahTagihan: toNumber(angsuran.total) + toNumber(angsuran.biayaAdmin),
        status: angsuran.dibayar ? 'LUNAS' : 'BELUM DIBAYAR',
      },
    };
  }

  // 7. Rekap Kwitansi Bulanan (Lampiran VIII)
  async getRekapKwitansiBulanan(user: JwtUser, tahun?: number, bulan?: number) {
    const satminkalId = user.satminkalId;
    const targetTahun = tahun || new Date().getFullYear();
    const targetBulan = bulan || new Date().getMonth() + 1;

    const headerInfo = await this.getKopstukAndTajuk(satminkalId);

    const startDate = new Date(Date.UTC(targetTahun, targetBulan - 1, 1));
    const endDate = new Date(Date.UTC(targetTahun, targetBulan, 1));

    const angsuranList = await this.prisma.angsuran.findMany({
      where: {
        pinjaman: { anggota: { satminkalId } },
        dibayar: true,
        tanggalBayar: { gte: startDate, lt: endDate },
      },
      include: {
        pinjaman: {
          include: {
            anggota: { include: { pangkat: true, korps: true, satminkal: true } },
          },
        },
      },
      orderBy: { tanggalBayar: 'asc' },
    });

    const data = angsuranList.map((a, i) => ({
      no: i + 1,
      noKwitansi: a.noInvoice || `-`,
      noTrans: a.pinjamanId,
      nama: a.pinjaman.anggota.nama,
      pktCrpNrp: `${a.pinjaman.anggota.pangkat.nama} ${a.pinjaman.anggota.korps.nama} / ${a.pinjaman.anggota.nrpNip}`,
      kesatuan: a.pinjaman.anggota.satminkal.nama,
      jumlahPinjaman: toNumber(a.pinjaman.nominal),
      jumlahAngsuran: toNumber(a.total),
      angsuranKeDari: `${a.bulanKe}/${a.pinjaman.tenorBulan}`,
      jatuhTempo: a.jatuhTempo.toISOString().slice(0, 10),
    }));

    const totalAngsuran = data.reduce((acc, curr) => acc + curr.jumlahAngsuran, 0);

    return {
      title: `DAFTAR KWITANSI BULAN ${targetBulan} TAHUN ${targetTahun}`,
      ...headerInfo,
      totalJumlahAngsuran: totalAngsuran,
      data,
    };
  }

  // 8. SHU Anggota (Lampiran IX)
  async getShuAnggota(user: JwtUser, tahun: number) {
    const satminkalId = user.satminkalId;
    const headerInfo = await this.getKopstukAndTajuk(satminkalId, 'LAPORAN_SHU');

    const periodeShu = await this.prisma.periodeShu.findUnique({
      where: { tahun },
      include: {
        shuAnggota: {
          where: { anggota: { satminkalId } },
          include: {
            anggota: { include: { pangkat: true, korps: true } },
          },
        },
      },
    });

    if (!periodeShu) {
      throw new NotFoundException(`Data SHU tahun ${tahun} belum dihitung`);
    }

    const data = periodeShu.shuAnggota.map((s, i) => ({
      no: i + 1,
      nama: s.anggota.nama,
      pktCrpNrp: `${s.anggota.pangkat.nama} ${s.anggota.korps.nama} / ${s.anggota.nrpNip}`,
      jasaModal: toNumber(s.jasaModal),
      jasaUsaha: toNumber(s.jasaUsaha),
      totalShu: toNumber(s.total),
    }));

    return {
      title: `LAPORAN SHU ANGGOTA KOPERASI TAHUN ${tahun}`,
      ...headerInfo,
      ringkasanShu: {
        tahun: periodeShu.tahun,
        totalPendapatan: toNumber(periodeShu.totalPendapatan),
        totalBeban: toNumber(periodeShu.totalBeban),
        shuBersih: toNumber(periodeShu.shuBersih),
        cadangan: toNumber(periodeShu.cadangan),
        jasaModal: toNumber(periodeShu.jasaModal),
        jasaUsaha: toNumber(periodeShu.jasaUsaha),
        pengurus: toNumber(periodeShu.pengurus),
        sosialPendidikan: toNumber(periodeShu.sosialPendidikan),
      },
      data,
    };
  }
}
