/*
  Warnings:

  - You are about to alter the column `nominal` on the `Pendapatan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - Changed the type of `jenis` on the `Pendapatan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "JenisTransaksiSimpanan" AS ENUM ('SETOR', 'TARIK');

-- AlterTable
ALTER TABLE "Pendapatan" ALTER COLUMN "nominal" SET DATA TYPE DECIMAL(18,2),
DROP COLUMN "jenis",
ADD COLUMN     "jenis" "JenisPendapatan" NOT NULL;

-- AlterTable
ALTER TABLE "Simpanan" ADD COLUMN     "noInvoice" TEXT,
ADD COLUMN     "tipe" "JenisTransaksiSimpanan" NOT NULL DEFAULT 'SETOR';
