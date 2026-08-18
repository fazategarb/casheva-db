-- CreateTable
CREATE TABLE "tb_pengaturan_koperasi" (
    "id" TEXT NOT NULL,
    "satminkalId" TEXT NOT NULL,
    "bungaPinjamanPersenTahun" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_pengaturan_koperasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_riwayat_bunga" (
    "id" TEXT NOT NULL,
    "satminkalId" TEXT NOT NULL,
    "bungaPersenTahun" DECIMAL(5,2) NOT NULL,
    "keterangan" TEXT,
    "diubahOlehId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_riwayat_bunga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_pengaturan_koperasi_satminkalId_key" ON "tb_pengaturan_koperasi"("satminkalId");

-- CreateIndex
CREATE INDEX "tb_riwayat_bunga_satminkalId_idx" ON "tb_riwayat_bunga"("satminkalId");

-- AddForeignKey
ALTER TABLE "tb_pengaturan_koperasi" ADD CONSTRAINT "tb_pengaturan_koperasi_satminkalId_fkey" FOREIGN KEY ("satminkalId") REFERENCES "tb_satker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
