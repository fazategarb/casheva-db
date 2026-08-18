/**
 * Timestamp waktu server backend pertama kali dinyalakan (dalam detik).
 * Digunakan untuk mereset/membatalkan token login lama jika server backend di-restart.
 */
export const SERVER_BOOT_TIME = Math.floor(Date.now() / 1000);
