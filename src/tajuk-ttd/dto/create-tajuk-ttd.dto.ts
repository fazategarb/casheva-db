import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTajukTtdDto {
  @IsNotEmpty()
  @IsString()
  jabatan!: string;

  @IsNotEmpty()
  @IsString()
  namaPejabat!: string;

  @IsNotEmpty()
  @IsString()
  pangkat!: string;

  @IsNotEmpty()
  @IsString()
  nrp!: string;

  @IsOptional()
  @IsBoolean()
  isAktif?: boolean;

  @IsOptional()
  @IsString()
  kategori?: string; // e.g., 'KWITANSI', 'LAPORAN_SHU'
}
