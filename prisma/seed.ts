import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import {
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

  const satkerRows = parseSemicolonCsv(path.join(dataDir, 'tb_satker.csv'));
  for (const row of satkerRows) {
    const kode = row.kd_Satker;
    const nama = row.nm_Satker;
    const kotamaKode = row.kd_Kotama;
    const kotamaId = kotamaIdByKode.get(kotamaKode);
    if (!kotamaId) {
      console.warn(`Lewati satker ${kode}: kotama ${kotamaKode} tidak ada`);
      continue;
    }
    await prisma.satminkal.upsert({
      where: { kode },
      create: { kode, nama, kotamaId },
      update: { nama, kotamaId },
    });
  }

  const pktRows = parseSemicolonCsv(path.join(dataDir, 'tb_pkt.csv'));
  for (const row of pktRows) {
    const kodePkt = Number(row.kd_pkt);
    const nama = row.ur_pkt;
    await prisma.pangkat.upsert({
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
  }

  const crpRows = parseSemicolonCsv(path.join(dataDir, 'tb_crp.csv'));
  for (const row of crpRows) {
    const kode = row.kd_crp.trim();
    const nama = row.ur_crp.trim();
    await prisma.korps.upsert({
      where: { kode },
      create: { kode, nama },
      update: { nama },
    });
  }

  const kotamaDefault = await prisma.kotama.findUnique({
    where: { kode: '01' },
  });
  const satminkalDefault = await prisma.satminkal.findUnique({
    where: { kode: '579276' },
  });

  if (kotamaDefault && satminkalDefault) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.upsert({
      where: { username: 'admin' },
      create: {
        username: 'admin',
        password: passwordHash,
        namaLengkap: 'Administrator Koperasi',
        role: Role.ADMIN_KOPERASI,
        kotamaId: kotamaDefault.id,
        satminkalId: satminkalDefault.id,
      },
      update: {
        password: passwordHash,
        kotamaId: kotamaDefault.id,
        satminkalId: satminkalDefault.id,
      },
    });
    console.log('👤 User demo: admin / Admin123!');

    // -------------------------------------------------------------
    // TAMBAHAN: Seed Dummy Anggota & Pinjaman untuk Pengujian API
    // -------------------------------------------------------------
    console.log('🌱 Seed dummy Anggota & Pinjaman...');

    const samplePangkat = await prisma.pangkat.findFirst();
    const sampleKorps = await prisma.korps.findFirst();

    if (samplePangkat && sampleKorps) {
      // 1. Buat Dummy Anggota 1 (Aktif, tanpa pinjaman)
      const anggota1 = await prisma.anggota.upsert({
        where: { nrpNip: '31010012340190' },
        create: {
          nrpNip: '31010012340190',
          nama: 'Sertu Ahmad Subagja',
          satminkalId: satminkalDefault.id,
          pangkatId: samplePangkat.id,
          korpsId: sampleKorps.id,
          isAktif: true,
        },
        update: {
          satminkalId: satminkalDefault.id,
        },
      });

      // 2. Buat Dummy Anggota 2 (Mempunyai pinjaman aktif/dicairkan)
      const anggota2 = await prisma.anggota.upsert({
        where: { nrpNip: '31010056780292' },
        create: {
          nrpNip: '31010056780292',
          nama: 'Serda Budi Santoso',
          satminkalId: satminkalDefault.id,
          pangkatId: samplePangkat.id,
          korpsId: sampleKorps.id,
          isAktif: true,
        },
        update: {
          satminkalId: satminkalDefault.id,
        },
      });

      // 3. Seed Pinjaman Dummy untuk Anggota 2 (Status DICAIRKAN + Angsuran)
      const pinjamanExisting = await prisma.pinjaman.findFirst({
        where: { anggotaId: anggota2.id, status: StatusPinjaman.DICAIRKAN },
      });

      if (!pinjamanExisting) {
        const nominal = 10000000; // Rp 10.000.000
        const tenor = 12; // 12 Bulan
        const tanggalCair = new Date();

        const pinjaman = await prisma.pinjaman.create({
          data: {
            anggotaId: anggota2.id,
            nominal: decimal(nominal),
            tenorBulan: tenor,
            bungaPersenTahun: decimal(12),
            status: StatusPinjaman.DICAIRKAN,
            tanggalCair,
            sisaPokok: decimal(nominal),
          },
        });

        const jadwal = hitungJadwalAngsuran(nominal, tenor);
        await prisma.angsuran.createMany({
          data: jadwal.map((row) => {
            const jatuh = new Date(
              tanggalCair.getFullYear(),
              tanggalCair.getMonth() + row.bulanKe,
              5,
            );
            return {
              pinjamanId: pinjaman.id,
              bulanKe: row.bulanKe,
              jatuhTempo: jatuh,
              pokok: decimal(row.pokok),
              bunga: decimal(row.bunga),
              total: decimal(row.total),
            };
          }),
        });

        console.log(
          `📌 Pinjaman demo dibuat untuk ${anggota2.nama} (ID: ${pinjaman.id})`,
        );
      }
    }
  }

  console.log('✅ Seed selesai.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
