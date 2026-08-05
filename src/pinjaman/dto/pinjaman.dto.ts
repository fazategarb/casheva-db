import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class CreatePinjamanDto {
  @ApiProperty()
  @IsNotEmpty()
  anggotaId!: string;

  @ApiProperty({ example: 5_000_000, minimum: 1_000_000, maximum: 20_000_000 })
  @IsNumber()
  @Min(1_000_000)
  @Max(20_000_000)
  nominal!: number;

  @ApiProperty({ example: 12, minimum: 1, maximum: 36 })
  @IsInt()
  @Min(1)
  @Max(36)
  tenorBulan!: number;
}

export class UpdateStatusPinjamanDto {
  @ApiProperty({
    enum: [
      'VERIFIKASI_PRIMKOP',
      'VERIFIKASI_JURU_BAYAR',
      'REKOMENDASI_PIMPINAN',
      'SETUJU_KAPRIM',
      'MENUNGGU_DOKUMEN',
      'DITOLAK',
    ],
  })
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional()
  catatan?: string;
}

export class CairkanPinjamanDto {
  @ApiPropertyOptional({ example: '2024-03-10' })
  tanggalCair?: string;
}
