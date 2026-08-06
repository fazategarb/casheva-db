import z from 'zod';

export const CreatePinjamanSchema = z.object({
  anggotaId: z.string().uuid({ message: 'ID Anggota tidak valid' }),
  nominalPinjaman: z
    .number()
    .min(1000000, { message: 'Nominal pinjaman minimal Rp 1.000.000' })
    .max(20000000, { message: 'Nominal pinjaman maksimal Rp 20.000.000' }),
  tenorBulan: z
    .number()
    .int()
    .min(1, { message: 'Tenor minimal 1 bulan' })
    .max(36, { message: 'Tenor maksimal 36 bulan' }),
  tujuanPinjaman: z
    .string()
    .min(5, { message: 'Tujuan pinjaman harus diisi secara jelas' }),
});

export const UpdateStatusPinjamanSchema = z.object({
  status: z.enum([
    'PENDING_JURU_BAYAR',
    'APPROVED_JURU_BAYAR',
    'APPROVED_DAN_SATPAS',
    'APPROVED_KAPRIM',
    'DISBURSED',
    'REJECTED',
  ]),
  catatan: z.string().optional(),
});

export type CreatePinjamanInput = z.infer<typeof CreatePinjamanSchema>;
export type UpdateStatusPinjamanInput = z.infer<
  typeof UpdateStatusPinjamanSchema
>;
