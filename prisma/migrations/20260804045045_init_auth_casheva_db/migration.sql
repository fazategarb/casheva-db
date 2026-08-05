-- CreateEnum
CREATE TYPE "KategoriPangkat" AS ENUM ('PAMEN', 'PAMA', 'BATA_ASN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN_KOPERASI', 'PIMPINAN', 'KAPRIM', 'PENGURUS', 'PENGAWAS');

-- CreateTable
CREATE TABLE "Kotama" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kotama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Satminkal" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kotamaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Satminkal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pangkat" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" "KategoriPangkat" NOT NULL,

    CONSTRAINT "Pangkat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Korps" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Korps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PENGURUS',
    "kotamaId" TEXT NOT NULL,
    "satminkalId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anggota" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nrpNip" TEXT NOT NULL,
    "pangkatId" TEXT NOT NULL,
    "korpsId" TEXT NOT NULL,
    "satminkalId" TEXT NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "tmtAnggota" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anggota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kotama_kode_key" ON "Kotama"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Satminkal_kode_key" ON "Satminkal"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Pangkat_nama_key" ON "Pangkat"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Korps_nama_key" ON "Korps"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Anggota_nrpNip_key" ON "Anggota"("nrpNip");

-- AddForeignKey
ALTER TABLE "Satminkal" ADD CONSTRAINT "Satminkal_kotamaId_fkey" FOREIGN KEY ("kotamaId") REFERENCES "Kotama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kotamaId_fkey" FOREIGN KEY ("kotamaId") REFERENCES "Kotama"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_satminkalId_fkey" FOREIGN KEY ("satminkalId") REFERENCES "Satminkal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_pangkatId_fkey" FOREIGN KEY ("pangkatId") REFERENCES "Pangkat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_korpsId_fkey" FOREIGN KEY ("korpsId") REFERENCES "Korps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_satminkalId_fkey" FOREIGN KEY ("satminkalId") REFERENCES "Satminkal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
