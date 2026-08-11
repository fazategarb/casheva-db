import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateKopstukDto {
  @IsOptional()
  @IsString()
  satminkalId?: string;

  @IsNotEmpty()
  @IsString()
  namaSatuan!: string;

  @IsNotEmpty()
  @IsString()
  namaBalak!: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  nomorTelepon?: string;
}
