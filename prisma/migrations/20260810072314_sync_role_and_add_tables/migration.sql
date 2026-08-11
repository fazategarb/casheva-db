/*
  Warnings:

  - The values [PENGURUS] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN_KOPERASI', 'PIMPINAN', 'KAPRIM', 'BENDAHARA', 'PENGAWAS', 'ANGGOTA', 'JURU_BAYAR');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN_KOPERASI';
COMMIT;

-- AlterTable
ALTER TABLE "Angsuran" ADD COLUMN     "biayaAdmin" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN_KOPERASI';

-- CreateTable
CREATE TABLE "tb_kopstuk" (
    "id" TEXT NOT NULL,
    "satminkalId" TEXT,
    "namaSatuan" TEXT NOT NULL,
    "namaBalak" TEXT NOT NULL,
    "alamat" TEXT,
    "nomorTelepon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_kopstuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_tajuk_ttd" (
    "id" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "namaPejabat" TEXT NOT NULL,
    "pangkat" TEXT NOT NULL,
    "nrp" TEXT NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "kategori" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_tajuk_ttd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_kopstuk_satminkalId_key" ON "tb_kopstuk"("satminkalId");

-- CreateIndex
CREATE INDEX "User_kotamaId_idx" ON "User"("kotamaId");

-- CreateIndex
CREATE INDEX "User_satminkalId_idx" ON "User"("satminkalId");

-- AddForeignKey
ALTER TABLE "tb_kopstuk" ADD CONSTRAINT "tb_kopstuk_satminkalId_fkey" FOREIGN KEY ("satminkalId") REFERENCES "tb_satker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
