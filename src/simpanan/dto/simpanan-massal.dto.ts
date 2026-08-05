import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class SimpananMassalDto {
  @ApiProperty({
    example: '2024-01-05',
    description: 'Tanggal periode (harus tanggal 5 bulan terkait)',
  })
  @IsDateString()
  @IsNotEmpty()
  periode!: string;
}
