import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
}
