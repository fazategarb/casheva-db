import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SatminkalService } from './satminkal.service';

@ApiTags('Master — Satminkal (Satker)')
@Controller('master/satminkal')
export class SatminkalController {
  constructor(private readonly satminkalService: SatminkalService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar Satminkal / tb_satker' })
  @ApiQuery({
    name: 'kotamaKode',
    required: false,
    description: 'Filter berdasarkan kd_Kotama',
    example: '02',
  })
  findAll(@Query('kotamaKode') kotamaKode?: string) {
    return this.satminkalService.findAll(kotamaKode);
  }

  @Get(':kode')
  @ApiOperation({ summary: 'Detail Satminkal by kd_Satker' })
  @ApiParam({ name: 'kode', example: '684672' })
  async findByKode(@Param('kode') kode: string) {
    const row = await this.satminkalService.findByKode(kode);
    if (!row) {
      throw new NotFoundException(
        `Satminkal dengan kode ${kode} tidak ditemukan`,
      );
    }
    return row;
  }
}
