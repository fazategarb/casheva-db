import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import {
  JenisPendapatan,
  JenisBiayaOperasional,
  JenisSimpanan,
  JenisTransaksiSimpanan,
  KategoriPangkat,
  PrismaClient,
  Role,
  StatusPinjaman,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { decimal } from '../src/common/utils/decimal.util';
import { hitungJadwalAngsuran } from '../src/common/utils/pinjaman-calculator';

function parseSemicolonCsv(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(';').map((h) => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(';').map((c) => c.replace(/^"|"$/g, '').trim());
    const row: Record<string, string> = {};
    header.forEach((key, i) => {
      row[key] = cols[i] ?? '';
    });
    return row;
  });
}

function kategoriPangkat(kodePkt: number): KategoriPangkat {
  if (kodePkt >= 83) return KategoriPangkat.PAMEN;
  if (kodePkt >= 81) return KategoriPangkat.PAMA;
  return KategoriPangkat.BATA_ASN;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL wajib di-set untuk seed');
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const dataDir = path.join(__dirname, 'data');

  console.log('🌱 Seed master TNI AD...');

  // 1. KOTAMA
  const kotamaRows = parseSemicolonCsv(path.join(dataDir, 'tb_kotama.csv'));
  const kotamaIdByKode = new Map<string, string>();

  for (const row of kotamaRows) {
    const kode = row.kd_Kotama;
    const nama = row.nm_Kotama;
    const saved = await prisma.kotama.upsert({
      where: { kode },
      create: { kode, nama },
      update: { nama },
    });
    kotamaIdByKode.set(kode, saved.id);
  }

  // 2. SATMINKAL / SATKER
  const satkerRows = parseSemicolonCsv(path.join(dataDir, 'tb_satker.csv'));
  const satminkalIdByKode = new Map<string, string>();

  for (const row of satkerRows) {
    const kode = row.kd_Satker;
    const nama = row.nm_Satker;
    const kotamaKode = row.kd_Kotama;
    const kotamaId = kotamaIdByKode.get(kotamaKode);
    if (!kotamaId) {
      continue;
    }
    const saved = await prisma.satminkal.upsert({
      where: { kode },
      create: { kode, nama, kotamaId },
      update: { nama, kotamaId },
    });
    satminkalIdByKode.set(kode, saved.id);
  }

  // 3. PANGKAT
  const pktRows = parseSemicolonCsv(path.join(dataDir, 'tb_pkt.csv'));
  const pangkatIdByKode = new Map<number, string>();

  for (const row of pktRows) {
    const kodePkt = Number(row.kd_pkt);
    const nama = row.ur_pkt;
    const saved = await prisma.pangkat.upsert({
      where: { kodePkt },
      create: {
        kodePkt,
        nama,
        kategori: kategoriPangkat(kodePkt),
      },
      update: {
        nama,
        kategori: kategoriPangkat(kodePkt),
      },
    });
    pangkatIdByKode.set(kodePkt, saved.id);
  }

  // 4. KORPS
  const crpRows = parseSemicolonCsv(path.join(dataDir, 'tb_crp.csv'));
  const korpsIdByKode = new Map<string, string>();

  for (const row of crpRows) {
    const kode = row.kd_crp.trim();
    const nama = row.ur_crp.trim();
    const saved = await prisma.korps.upsert({
      where: { kode },
      create: { kode, nama },
      update: { nama },
    });
    korpsIdByKode.set(kode, saved.id);
  }

  const kotamaDefault = await prisma.kotama.findUnique({
    where: { kode: '01' },
  });
  const satminkalDefault = await prisma.satminkal.findUnique({
    where: { kode: '579276' },
  });

  if (!kotamaDefault || !satminkalDefault) {
    throw new Error('Default Kotama / Satminkal tidak ditemukan setelah seed master');
  }

  // 5. USERS DEMO (Admin, Pimpinan, Kaprim, Bendahara, Pengawas, Juru Bayar)
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const rolesToCreate = [
    { username: 'admin', role: Role.ADMIN_KOPERASI, nama: 'Administrator Koperasi' },
    { username: 'pimpinan', role: Role.PIMPINAN, nama: 'Kolonel Inf Heru (Dan/Ka)' },
    { username: 'kaprim', role: Role.KAPRIM, nama: 'Letkol Inf Sigit (Kaprim)' },
    { username: 'bendahara', role: Role.BENDAHARA, nama: 'Lettu Cku Budi (Bendahara)' },
    { username: 'pengawas', role: Role.PENGAWAS, nama: 'Mayor Inf Tri (Pengawas)' },
    { username: 'jurubayar', role: Role.JURU_BAYAR, nama: 'Serma Agus (Juru Bayar)' },
  ];

  for (const u of rolesToCreate) {
    await prisma.user.upsert({
      where: { username: u.username },
      create: {
        username: u.username,
        password: passwordHash,
        namaLengkap: u.nama,
        role: u.role,
        kotamaId: kotamaDefault.id,
        satminkalId: satminkalDefault.id,
      },
      update: {
        password: passwordHash,
        kotamaId: kotamaDefault.id,
        satminkalId: satminkalDefault.id,
      },
    });
  }
  console.log('👤 Users demo (password: Admin123!): admin, pimpinan, kaprim, bendahara, pengawas, jurubayar');

  // 6. KOPSTUK & TAJUK TANDA TANGAN
  await prisma.kopstuk.upsert({
    where: { satminkalId: satminkalDefault.id },
    create: {
      satminkalId: satminkalDefault.id,
      namaSatuan: 'MARKAS BESAR ANGKATAN DARAT',
      namaBalak: 'DINAS INFORMASI DAN PENGOLAHAN DATA',
      alamat: 'Jl. Veteran No. 5, Jakarta Pusat',
      nomorTelepon: '021-3840123',
    },
    update: {
      namaSatuan: 'MARKAS BESAR ANGKATAN DARAT',
      namaBalak: 'DINAS INFORMASI DAN PENGOLAHAN DATA',
    },
  });

  const countTtd = await prisma.tajukTandaTangan.count();
  if (countTtd === 0) {
    await prisma.tajukTandaTangan.createMany({
      data: [
        {
          jabatan: 'Kasubdistekinfo Selaku Kalakgiat',
          namaPejabat: 'Sigit Suhendro Hadi K., S.T., M.Tr.(Han)',
          pangkat: 'Kolonel Inf',
          nrp: '11020019460278',
          isAktif: true,
          kategori: 'LAPORAN_SHU',
        },
        {
          jabatan: 'Kepala Primkopad',
          namaPejabat: 'Sigit Widiyanto',
          pangkat: 'Letkol Inf',
          nrp: '11035678901234',
          isAktif: true,
          kategori: 'AKAD_KREDIT',
        },
        {
          jabatan: 'Bendahara Koperasi',
          namaPejabat: 'Budi Raharjo',
          pangkat: 'Lettu Cku',
          nrp: '21030045670889',
          isAktif: true,
          kategori: 'KWITANSI',
        },
      ],
    });
  }

  // 7. SEED ANGGOTA DUMMY (Minimal 20 records: 5 Pamen, 5 Pama, 10 Ba/Ta/PNS)
  console.log('🌱 Seed Data 20 Anggota Dummy (5 Pamen, 5 Pama, 10 Ba/Ta/PNS)...');

  // Ambil sampel Pangkat & Korps dari DB
  const pamenPangkat = await prisma.pangkat.findFirst({ where: { kategori: KategoriPangkat.PAMEN } });
  const pamaPangkat = await prisma.pangkat.findFirst({ where: { kategori: KategoriPangkat.PAMA } });
  const bataPangkat = await prisma.pangkat.findFirst({ where: { kategori: KategoriPangkat.BATA_ASN } });
  const infKorps = await prisma.korps.findFirst({ where: { kode: '1' } }) || (await prisma.korps.findFirst());

  if (!pamenPangkat || !pamaPangkat || !bataPangkat || !infKorps) {
    throw new Error('Master Pangkat / Korps tidak cukup untuk me-seed anggota');
  }

  const dummyAnggotaDefs = [
    // 5 PAMEN
    { nama: 'Sigit Suhendro', nrp: '1102123401', pkt: pamenPangkat.id, crp: infKorps.id },
    { nama: 'Aan Sugiyanto', nrp: '1103567802', pkt: pamenPangkat.id, crp: infKorps.id },
    { nama: 'Bambang Kuswanto', nrp: '1104112203', pkt: pamenPangkat.id, crp: infKorps.id },
    { nama: 'Candra Wijaya', nrp: '1105334404', pkt: pamenPangkat.id, crp: infKorps.id },
    { nama: 'Dedi Prasetyo', nrp: '1106556605', pkt: pamenPangkat.id, crp: infKorps.id },

    // 5 PAMA
    { nama: 'Eko Yulianto', nrp: '2107778806', pkt: pamaPangkat.id, crp: infKorps.id },
    { nama: 'Fajar Nugroho', nrp: '2108990007', pkt: pamaPangkat.id, crp: infKorps.id },
    { nama: 'Gilang Ramadhan', nrp: '2109112208', pkt: pamaPangkat.id, crp: infKorps.id },
    { nama: 'Heri Susanto', nrp: '2110334409', pkt: pamaPangkat.id, crp: infKorps.id },
    { nama: 'Irfan Bachdim', nrp: '2111556610', pkt: pamaPangkat.id, crp: infKorps.id },

    // 10 BA/TA/PNS
    { nama: 'Joko Widodo', nrp: '3112778811', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Kurniadi', nrp: '3113990012', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Lukman Hakim', nrp: '3114112213', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Mulyadi', nrp: '3115334414', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Nurdin', nrp: '3116556615', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Oktavianus', nrp: '3117778816', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Prabowo Subianto', nrp: '3118990017', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Qomaruddin', nrp: '3119112218', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Rudi Hartono', nrp: '3120334419', pkt: bataPangkat.id, crp: infKorps.id },
    { nama: 'Syafruddin', nrp: '3121556620', pkt: bataPangkat.id, crp: infKorps.id },
  ];

  const createdAnggotaList: any[] = [];
  for (const def of dummyAnggotaDefs) {
    const a = await prisma.anggota.upsert({
      where: { nrpNip: def.nrp },
      create: {
        nama: def.nama,
        nrpNip: def.nrp,
        pangkatId: def.pkt,
        korpsId: def.crp,
        satminkalId: satminkalDefault.id,
        isAktif: true,
        tmtAnggota: new Date('2024-01-01'),
      },
      update: {
        nama: def.nama,
        satminkalId: satminkalDefault.id,
      },
      include: { pangkat: true },
    });
    createdAnggotaList.push(a);
  }
  console.log(`✅ ${createdAnggotaList.length} Anggota dummy berhasil disiapkan.`);

  // 8. SEED SIMPANAN POKOK & WAJIB (Sekali Awal Masuk)
  console.log('🌱 Seed Simpanan Pokok (Rp 50k) & Wajib (Rp 100k) untuk seluruh anggota...');
  for (const a of createdAnggotaList) {
    const countP = await prisma.simpanan.count({
      where: { anggotaId: a.id, jenis: JenisSimpanan.POKOK },
    });
    if (countP === 0) {
      await prisma.simpanan.create({
        data: {
          anggotaId: a.id,
          jenis: JenisSimpanan.POKOK,
          tipe: JenisTransaksiSimpanan.SETOR,
          nominal: decimal(50000),
          periode: new Date('2024-01-01'),
          keterangan: 'Simpanan pokok awal',
        },
      });
    }

    const countW = await prisma.simpanan.count({
      where: { anggotaId: a.id, jenis: JenisSimpanan.WAJIB },
    });
    if (countW === 0) {
      await prisma.simpanan.create({
        data: {
          anggotaId: a.id,
          jenis: JenisSimpanan.WAJIB,
          tipe: JenisTransaksiSimpanan.SETOR,
          nominal: decimal(100000),
          periode: new Date('2024-01-01'),
          keterangan: 'Simpanan wajib awal',
        },
      });
    }
  }

  // 9. SEED SIMPANAN SUKARELA (Januari 2024 s.d. Juni 2026 = 30 Bulan) Sesuai Poin 9.c.4 PDF
  console.log('🌱 Seed Simpanan Sukarela Bulanan (Jan 2024 s.d. Juni 2026)...');
  const startYear = 2024;
  const startMonth = 0; // Jan
  const endYear = 2026;
  const endMonth = 5; // Jun

  const sukarelaEntries: any[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === endYear ? endMonth : 11;

    for (let m = mStart; m <= mEnd; m++) {
      const periodeTgl = new Date(Date.UTC(y, m, 5));

      for (const a of createdAnggotaList) {
        let nominalSukarela = 150000; // Ba/Ta/PNS
        if (a.pangkat.kategori === KategoriPangkat.PAMEN) nominalSukarela = 300000;
        else if (a.pangkat.kategori === KategoriPangkat.PAMA) nominalSukarela = 250000;

        sukarelaEntries.push({
          anggotaId: a.id,
          jenis: JenisSimpanan.SUKARELA,
          tipe: JenisTransaksiSimpanan.SETOR,
          nominal: decimal(nominalSukarela),
          periode: periodeTgl,
          createdAt: periodeTgl,
          keterangan: `Potong sukarela ${y}-${String(m + 1).padStart(2, '0')}`,
        });
      }
    }
  }

  // Cek apakah sudah ada simpanan sukarela untuk menghindari duplikasi
  const existingSukarelaCount = await prisma.simpanan.count({
    where: { jenis: JenisSimpanan.SUKARELA },
  });
  if (existingSukarelaCount === 0) {
    await prisma.simpanan.createMany({ data: sukarelaEntries });
    console.log(`✅ ${sukarelaEntries.length} entri Simpanan Sukarela berhasil disimpan.`);
  }

  // 10. SEED PINJAMAN & ANGSURAN (Minimal 10 Records dengan Variasi Tenor & Status)
  console.log('🌱 Seed 10 Data Pinjaman & Angsuran...');
  const pinjamanConfigs = [
    { anggotaIdx: 0, nominal: 20000000, tenor: 36, status: StatusPinjaman.DICAIRKAN, paidMonths: 12 },
    { anggotaIdx: 1, nominal: 15000000, tenor: 24, status: StatusPinjaman.DICAIRKAN, paidMonths: 6 },
    { anggotaIdx: 2, nominal: 10000000, tenor: 12, status: StatusPinjaman.DICAIRKAN, paidMonths: 4 },
    { anggotaIdx: 3, nominal: 8000000, tenor: 10, status: StatusPinjaman.LUNAS, paidMonths: 10 },
    { anggotaIdx: 4, nominal: 5000000, tenor: 6, status: StatusPinjaman.DICAIRKAN, paidMonths: 2 },
    { anggotaIdx: 5, nominal: 12000000, tenor: 24, status: StatusPinjaman.SETUJU_KAPRIM, paidMonths: 0 },
    { anggotaIdx: 6, nominal: 7000000, tenor: 12, status: StatusPinjaman.REKOMENDASI_PIMPINAN, paidMonths: 0 },
    { anggotaIdx: 7, nominal: 4000000, tenor: 6, status: StatusPinjaman.VERIFIKASI_JURU_BAYAR, paidMonths: 0 },
    { anggotaIdx: 8, nominal: 3000000, tenor: 6, status: StatusPinjaman.VERIFIKASI_PRIMKOP, paidMonths: 0 },
    { anggotaIdx: 9, nominal: 2000000, tenor: 6, status: StatusPinjaman.DIAJUKAN, paidMonths: 0 },
  ];

  for (let idx = 0; idx < pinjamanConfigs.length; idx++) {
    const cfg = pinjamanConfigs[idx];
    const anggotaTarget = createdAnggotaList[cfg.anggotaIdx];

    const existLoan = await prisma.pinjaman.findFirst({
      where: { anggotaId: anggotaTarget.id },
    });

    if (!existLoan) {
      const tglCair = cfg.status === StatusPinjaman.DICAIRKAN || cfg.status === StatusPinjaman.LUNAS
        ? new Date('2025-01-10')
        : null;

      const p = await prisma.pinjaman.create({
        data: {
          anggotaId: anggotaTarget.id,
          nominal: decimal(cfg.nominal),
          tenorBulan: cfg.tenor,
          bungaPersenTahun: decimal(12),
          status: cfg.status,
          tanggalCair: tglCair ?? undefined,
          sisaPokok: decimal(cfg.status === StatusPinjaman.LUNAS ? 0 : cfg.nominal - (cfg.paidMonths * (cfg.nominal / cfg.tenor))),
        },
      });

      // Buat jadwal angsuran jika status DICAIRKAN / LUNAS
      if (tglCair) {
        const jadwal = hitungJadwalAngsuran(cfg.nominal, cfg.tenor);
        const angsuranData: any[] = [];

        for (let b = 0; b < jadwal.length; b++) {
          const row = jadwal[b];
          const isPaid = b < cfg.paidMonths;
          const jatuh = new Date(tglCair.getFullYear(), tglCair.getMonth() + row.bulanKe, 5);
          const tglBayar = isPaid ? new Date(tglCair.getFullYear(), tglCair.getMonth() + row.bulanKe, 3) : null;
          const seq = String(idx * 100 + row.bulanKe).padStart(6, '0');
          const invoiceNo = isPaid ? `KW-2025-579276-${seq}` : null;

          angsuranData.push({
            pinjamanId: p.id,
            bulanKe: row.bulanKe,
            jatuhTempo: jatuh,
            pokok: decimal(row.pokok),
            bunga: decimal(row.bunga),
            biayaAdmin: decimal(0),
            total: decimal(row.total),
            dibayar: isPaid,
            tanggalBayar: tglBayar ?? undefined,
            noInvoice: invoiceNo ?? undefined,
          });
        }

        await prisma.angsuran.createMany({ data: angsuranData });
      }
    }
  }
  console.log('✅ 10 Pinjaman dummy beserta angsuran & kwitansi selesai disiapakan.');

  // 11. SEED PENDAPATAN & BIAYA OPERASIONAL (Untuk kalkulasi SHU 2024, 2025, 2026)
  console.log('🌱 Seed Data Pendapatan & Biaya Operasional untuk SHU...');
  const years = [2024, 2025, 2026];

  for (const yr of years) {
    const pCount = await prisma.pendapatan.count({ where: { tahun: yr } });
    if (pCount === 0) {
      await prisma.pendapatan.createMany({
        data: [
          { satminkalId: satminkalDefault.id, tahun: yr, jenis: JenisPendapatan.BUNGA_PINJAMAN, nominal: decimal(45000000), keterangan: `Pendapatan Bunga Pinjaman ${yr}` },
          { satminkalId: satminkalDefault.id, tahun: yr, jenis: JenisPendapatan.ADMINISTRASI_RISIKO, nominal: decimal(15000000), keterangan: `Pendapatan Admin Pinjaman ${yr}` },
          { satminkalId: satminkalDefault.id, tahun: yr, jenis: JenisPendapatan.JASA_LAINNYA, nominal: decimal(10000000), keterangan: `Jasa Deposito & Bank ${yr}` },
        ],
      });
    }

    const bCount = await prisma.biayaOperasional.count({ where: { tahun: yr } });
    if (bCount === 0) {
      await prisma.biayaOperasional.createMany({
        data: [
          { tahun: yr, jenis: JenisBiayaOperasional.HONOR_PENGURUS, nominal: decimal(8000000), keterangan: `Honor Pengurus & Pengawas ${yr}` },
          { tahun: yr, jenis: JenisBiayaOperasional.OPERASIONAL_KANTOR, nominal: decimal(7000000), keterangan: `Biaya Operasional Kantor ${yr}` },
          { tahun: yr, jenis: JenisBiayaOperasional.RAPAT_PENDIDIKAN_SOSIAL, nominal: decimal(5000000), keterangan: `Biaya Rapat RAT & Sosial ${yr}` },
        ],
      });
    }
  }

  console.log('✅ SEED SELESAI DENGAN SUKSES! Seluruh data dummy telah siap.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('❌ Error Seeding:', e);
  process.exit(1);
});
