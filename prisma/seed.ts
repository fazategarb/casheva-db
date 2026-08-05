import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { KategoriPangkat, PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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
  }

  console.log('✅ Seed selesai.');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
