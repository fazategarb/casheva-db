/*
  Warnings:

  - You are about to drop the column `tanggal` on the `Pendapatan` table. All the data in the column will be lost.
  - Changed the type of `jenis` on the `Pendapatan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Pendapatan" DROP COLUMN "tanggal",
ADD COLUMN     "satminkalId" TEXT,
DROP COLUMN "jenis",
ADD COLUMN     "jenis" TEXT NOT NULL,
ALTER COLUMN "nominal" SET DATA TYPE DECIMAL(65,30);

-- AddForeignKey
ALTER TABLE "Pendapatan" ADD CONSTRAINT "Pendapatan_satminkalId_fkey" FOREIGN KEY ("satminkalId") REFERENCES "tb_satker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
