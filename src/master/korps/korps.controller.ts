import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { KorpsService } from './korps.service';

@ApiTags('Master — Korps')
@Controller('master/korps')
export class KorpsController {
  constructor(private readonly korpsService: KorpsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar Korps (tb_crp)' })
  findAll() {
    return this.korpsService.findAll();
  }

  @Get(':kode')
  @ApiOperation({ summary: 'Detail Korps by kd_crp' })
  @ApiParam({ name: 'kode', example: 'A' })
  async findByKode(@Param('kode') kode: string) {
    const row = await this.korpsService.findByKode(kode.toUpperCase());
    if (!row) {
      throw new NotFoundException(`Korps dengan kode ${kode} tidak ditemukan`);
    }
    return row;
  }
}
