/*
  Warnings:

  - You are about to drop the `Korps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Kotama` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pangkat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Satminkal` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "JenisSimpanan" AS ENUM ('POKOK', 'WAJIB', 'SUKARELA');

-- CreateEnum
CREATE TYPE "StatusPinjaman" AS ENUM ('DIAJUKAN', 'VERIFIKASI_PRIMKOP', 'VERIFIKASI_JURU_BAYAR', 'REKOMENDASI_PIMPINAN', 'SETUJU_KAPRIM', 'DITOLAK', 'MENUNGGU_DOKUMEN', 'DICAIRKAN', 'LUNAS');

-- CreateEnum
CREATE TYPE "JenisPendapatan" AS ENUM ('BUNGA_PINJAMAN', 'ADMINISTRASI_RISIKO', 'JASA_LAINNYA');

-- CreateEnum
CREATE TYPE "JenisBiayaOperasional" AS ENUM ('HONOR_PENGURUS', 'OPERASIONAL_KANTOR', 'RAPAT_PENDIDIKAN_SOSIAL', 'LAINNYA');

-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_korpsId_fkey";

-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_pangkatId_fkey";

-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_satminkalId_fkey";

-- DropForeignKey
ALTER TABLE "Satminkal" DROP CONSTRAINT "Satminkal_kotamaId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_kotamaId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_satminkalId_fkey";

-- DropTable
DROP TABLE "Korps";

-- DropTable
DROP TABLE "Kotama";

-- DropTable
DROP TABLE "Pangkat";

-- DropTable
DROP TABLE "Satminkal";

-- CreateTable
CREATE TABLE "tb_kotama" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_kotama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_satker" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kotamaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_satker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pkt" (
    "id" TEXT NOT NULL,
    "kodePkt" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" "KategoriPangkat" NOT NULL,

    CONSTRAINT "tb_pkt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_crp" (
    "id" TEXT NOT NULL,
    "kode" CHAR(1) NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "tb_crp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simpanan" (
    "id" TEXT NOT NULL,
    "anggotaId" TEXT NOT NULL,
    "jenis" "JenisSimpanan" NOT NULL,
    "nominal" DECIMAL(18,2) NOT NULL,
    "periode" TIMESTAMP(3),
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simpanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pinjaman" (
    "id" TEXT NOT NULL,
    "anggotaId" TEXT NOT NULL,
    "nominal" DECIMAL(18,2) NOT NULL,
    "tenorBulan" INTEGER NOT NULL,
    "bungaPersenTahun" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "status" "StatusPinjaman" NOT NULL DEFAULT 'DIAJUKAN',
    "tanggalAjuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalCair" TIMESTAMP(3),
    "sisaPokok" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pinjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Angsuran" (
    "id" TEXT NOT NULL,
    "pinjamanId" TEXT NOT NULL,
    "bulanKe" INTEGER NOT NULL,
    "jatuhTempo" TIMESTAMP(3) NOT NULL,
    "pokok" DECIMAL(18,2) NOT NULL,
    "bunga" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "dibayar" BOOLEAN NOT NULL DEFAULT false,
    "tanggalBayar" TIMESTAMP(3),
    "noInvoice" TEXT,

    CONSTRAINT "Angsuran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DokumenPinjaman" (
    "id" TEXT NOT NULL,
    "pinjamanId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DokumenPinjaman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendapatan" (
    "id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "jenis" "JenisPendapatan" NOT NULL,
    "nominal" DECIMAL(18,2) NOT NULL,
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pendapatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiayaOperasional" (
    "id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "jenis" "JenisBiayaOperasional" NOT NULL,
    "nominal" DECIMAL(18,2) NOT NULL,
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BiayaOperasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodeShu" (
    "id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "totalPendapatan" DECIMAL(18,2) NOT NULL,
    "totalBeban" DECIMAL(18,2) NOT NULL,
    "shuBersih" DECIMAL(18,2) NOT NULL,
    "cadangan" DECIMAL(18,2) NOT NULL,
    "jasaModal" DECIMAL(18,2) NOT NULL,
    "jasaUsaha" DECIMAL(18,2) NOT NULL,
    "pengurus" DECIMAL(18,2) NOT NULL,
    "sosialPendidikan" DECIMAL(18,2) NOT NULL,
    "ditutup" BOOLEAN NOT NULL DEFAULT false,
    "ditutupPada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodeShu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShuAnggota" (
    "id" TEXT NOT NULL,
    "periodeShuId" TEXT NOT NULL,
    "anggotaId" TEXT NOT NULL,
    "jasaModal" DECIMAL(18,2) NOT NULL,
    "jasaUsaha" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "ShuAnggota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_kotama_kode_key" ON "tb_kotama"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "tb_satker_kode_key" ON "tb_satker"("kode");

-- CreateIndex
CREATE INDEX "tb_satker_kotamaId_idx" ON "tb_satker"("kotamaId");

-- CreateIndex
CREATE UNIQUE INDEX "tb_pkt_kodePkt_key" ON "tb_pkt"("kodePkt");

-- CreateIndex
CREATE UNIQUE INDEX "tb_crp_kode_key" ON "tb_crp"("kode");

-- CreateIndex
CREATE INDEX "Simpanan_anggotaId_jenis_idx" ON "Simpanan"("anggotaId", "jenis");

-- CreateIndex
CREATE INDEX "Simpanan_periode_idx" ON "Simpanan"("periode");

-- CreateIndex
CREATE INDEX "Pinjaman_anggotaId_idx" ON "Pinjaman"("anggotaId");

-- CreateIndex
CREATE INDEX "Pinjaman_status_idx" ON "Pinjaman"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Angsuran_noInvoice_key" ON "Angsuran"("noInvoice");

-- CreateIndex
CREATE UNIQUE INDEX "Angsuran_pinjamanId_bulanKe_key" ON "Angsuran"("pinjamanId", "bulanKe");

-- CreateIndex
CREATE INDEX "Pendapatan_tahun_idx" ON "Pendapatan"("tahun");

-- CreateIndex
CREATE INDEX "BiayaOperasional_tahun_idx" ON "BiayaOperasional"("tahun");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodeShu_tahun_key" ON "PeriodeShu"("tahun");

-- CreateIndex
CREATE UNIQUE INDEX "ShuAnggota_periodeShuId_anggotaId_key" ON "ShuAnggota"("periodeShuId", "anggotaId");

-- CreateIndex
CREATE INDEX "Anggota_satminkalId_idx" ON "Anggota"("satminkalId");

-- AddForeignKey
ALTER TABLE "tb_satker" ADD CONSTRAINT "tb_satker_kotamaId_fkey" FOREIGN KEY ("kotamaId") REFERENCES "tb_kotama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kotamaId_fkey" FOREIGN KEY ("kotamaId") REFERENCES "tb_kotama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_satminkalId_fkey" FOREIGN KEY ("satminkalId") REFERENCES "tb_satker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_pangkatId_fkey" FOREIGN KEY ("pangkatId") REFERENCES "tb_pkt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_korpsId_fkey" FOREIGN KEY ("korpsId") REFERENCES "tb_crp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_satminkalId_fkey" FOREIGN KEY ("satminkalId") REFERENCES "tb_satker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simpanan" ADD CONSTRAINT "Simpanan_anggotaId_fkey" FOREIGN KEY ("anggotaId") REFERENCES "Anggota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pinjaman" ADD CONSTRAINT "Pinjaman_anggotaId_fkey" FOREIGN KEY ("anggotaId") REFERENCES "Anggota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Angsuran" ADD CONSTRAINT "Angsuran_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES "Pinjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DokumenPinjaman" ADD CONSTRAINT "DokumenPinjaman_pinjamanId_fkey" FOREIGN KEY ("pinjamanId") REFERENCES "Pinjaman"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShuAnggota" ADD CONSTRAINT "ShuAnggota_periodeShuId_fkey" FOREIGN KEY ("periodeShuId") REFERENCES "PeriodeShu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShuAnggota" ADD CONSTRAINT "ShuAnggota_anggotaId_fkey" FOREIGN KEY ("anggotaId") REFERENCES "Anggota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
