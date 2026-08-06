import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusPinjaman } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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
  @ApiProperty({ enum: StatusPinjaman })
  @IsEnum(StatusPinjaman)
  status!: StatusPinjaman;

  // Tambahkan decorator ini agar diterima oleh ValidationPipe
  @ApiPropertyOptional({ example: 'Dokumen lengkap dan memenuhi syarat' })
  @IsOptional()
  @IsString()
  catatan?: string;
}

export class CairkanPinjamanDto {
  @ApiPropertyOptional({
    example: '2026-08-07',
    description: 'Tanggal pencairan (ISO format)',
  })
  @IsOptional()
  @IsDateString()
  tanggalCair?: string;
}
