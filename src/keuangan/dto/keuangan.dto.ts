import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { JenisBiayaOperasional, JenisPendapatan } from '@prisma/client';

export class CreatePendapatanDto {
  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(2000)
  tahun!: number;

  @ApiProperty({ enum: JenisPendapatan })
  @IsEnum(JenisPendapatan)
  jenis!: JenisPendapatan;

  @ApiProperty({ example: 1_500_000 })
  @IsNumber()
  @Min(0)
  nominal!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keterangan?: string;
}

export class CreateBiayaDto {
  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(2000)
  tahun!: number;

  @ApiProperty({ enum: JenisBiayaOperasional })
  @IsEnum(JenisBiayaOperasional)
  jenis!: JenisBiayaOperasional;

  @ApiProperty({ example: 500_000 })
  @IsNumber()
  @Min(0)
  nominal!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keterangan?: string;
}

export class HitungShuDto {
  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(2000)
  tahun!: number;

  @ApiProperty({ example: 25, description: 'Persentase Cadangan Koperasi (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  persenCadangan: number = 25;

  @ApiProperty({
    example: 20,
    description: 'Persentase Jasa Modal / Simpanan (%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  persenJasaModal: number = 20;

  @ApiProperty({
    example: 25,
    description: 'Persentase Jasa Usaha / Pinjaman (%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  persenJasaUsaha: number = 25;

  @ApiProperty({ example: 15, description: 'Persentase Pengurus (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  persenPengurus: number = 15;

  @ApiProperty({
    example: 15,
    description: 'Persentase Dana Sosial & Pendidikan (%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  persenSosialPendidikan: number = 15;
}
