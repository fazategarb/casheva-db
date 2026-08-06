export interface SimulasiAngsuranItem {
  bulanKe: number;
  angsuranPokok: number;
  angsuranBunga: number;
  totalAngsuran: number;
  sisaPokok: number;
}

export interface HasilSimulasiPinjaman {
  nominalPinjaman: number;
  tenorBulan: number;
  sukuBungaPerBulan: number; // 0.01 (1%)
  angsuranPokokBulanan: number;
  angsuranBungaBulanan: number;
  totalAngsuranBulanan: number;
  totalPembayaran: number;
  totalBunga: number;
  biayaAdministrasi: number;
  jadwalAngsuran: SimulasiAngsuranItem[];
}

/**
 * Menghitung simulasi angsuran pinjaman berdasarkan aturan USIPA
 * - Bunga: 1% per bulan (12% per tahun)
 * - Nominal: Rp 1.000.000 s.d. Rp 20.000.000
 * - Tenor: Max 36 Bulan
 */
export function hitungSimulasiPinjaman(
  nominal: number,
  tenor: number,
  persenAdmin: number = 0.01, // Default 1% biaya administrasi (dapat disesuaikan)
): HasilSimulasiPinjaman {
  const bungaRate = 0.01; // 1% per bulan

  const angsuranPokokBulanan = Math.round(nominal / tenor);
  const angsuranBungaBulanan = Math.round(nominal * bungaRate);
  const totalAngsuranBulanan = angsuranPokokBulanan + angsuranBungaBulanan;

  const totalBunga = angsuranBungaBulanan * tenor;
  const totalPembayaran = totalAngsuranBulanan * tenor;
  const biayaAdministrasi = Math.round(nominal * persenAdmin);

  const jadwalAngsuran: SimulasiAngsuranItem[] = [];
  let sisaPokok = nominal;

  for (let i = 1; i <= tenor; i++) {
    // Penyesuaian pembulatan pada bulan terakhir agar sisa pokok tepat 0
    let pokokBulanIni = angsuranPokokBulanan;
    if (i === tenor) {
      pokokBulanIni = sisaPokok;
    }

    sisaPokok -= pokokBulanIni;

    jadwalAngsuran.push({
      bulanKe: i,
      angsuranPokok: pokokBulanIni,
      angsuranBunga: angsuranBungaBulanan,
      totalAngsuran: pokokBulanIni + angsuranBungaBulanan,
      sisaPokok: Math.max(0, sisaPokok),
    });
  }

  return {
    nominalPinjaman: nominal,
    tenorBulan: tenor,
    sukuBungaPerBulan: bungaRate,
    angsuranPokokBulanan,
    angsuranBungaBulanan,
    totalAngsuranBulanan,
    totalPembayaran,
    totalBunga,
    biayaAdministrasi,
    jadwalAngsuran,
  };
}
