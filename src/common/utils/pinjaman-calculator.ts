import { roundRp } from './decimal.util';

export interface AngsuranBaris {
  bulanKe: number;
  pokok: number;
  bunga: number;
  total: number;
  sisaPokok: number;
}

/** Bunga 1% per bulan dari sisa pokok; pokok flat per bulan. */
export function hitungJadwalAngsuran(
  nominal: number,
  tenorBulan: number,
  bungaPersenBulan = 1,
): AngsuranBaris[] {
  const pokokPerBulan = roundRp(nominal / tenorBulan);
  let sisa = nominal;
  const rows: AngsuranBaris[] = [];

  for (let bulan = 1; bulan <= tenorBulan; bulan += 1) {
    const pokok = bulan === tenorBulan ? roundRp(sisa) : pokokPerBulan;
    const bunga = roundRp((sisa * bungaPersenBulan) / 100);
    const total = pokok + bunga;
    sisa = roundRp(sisa - pokok);

    rows.push({
      bulanKe: bulan,
      pokok,
      bunga,
      total,
      sisaPokok: Math.max(0, sisa),
    });
  }

  return rows;
}

export function validasiPinjaman(
  nominal: number,
  tenorBulan: number,
): string | null {
  if (nominal < 1_000_000 || nominal > 20_000_000) {
    return 'Nominal pinjaman harus antara Rp 1.000.000 dan Rp 20.000.000';
  }
  if (tenorBulan < 1 || tenorBulan > 36) {
    return 'Tenor pinjaman maksimal 36 bulan';
  }
  return null;
}
