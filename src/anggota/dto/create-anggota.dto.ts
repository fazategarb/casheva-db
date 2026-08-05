import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAnggotaDto {
  @ApiProperty({ example: 'Letkol Inf Sigit Widiyanto' })
  @IsString()
  @IsNotEmpty()
  nama!: string;

  @ApiProperty({ example: '1102123456789' })
  @IsString()
  @IsNotEmpty()
  nrpNip!: string;

  @ApiProperty({ description: 'UUID dari GET /master/pangkat' })
  @IsUUID()
  pangkatId!: string;

  @ApiProperty({ description: 'UUID dari GET /master/korps' })
  @IsUUID()
  korpsId!: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  tmtAnggota?: string;
}

export class UpdateAnggotaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nama?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nrpNip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pangkatId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  korpsId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAktif?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  tmtAnggota?: string;
}
