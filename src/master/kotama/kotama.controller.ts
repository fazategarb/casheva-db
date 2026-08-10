import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KotamaService } from './kotama.service';

@ApiTags('Master — Kotama')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('master/kotama')
export class KotamaController {
  constructor(private readonly kotamaService: KotamaService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar Kotama (tb_kotama)' })
  findAll() {
    return this.kotamaService.findAll();
  }

  @Get(':kode')
  @ApiOperation({ summary: 'Detail Kotama beserta Satminkal' })
  @ApiParam({ name: 'kode', example: '02' })
  async findByKode(@Param('kode') kode: string) {
    const row = await this.kotamaService.findByKode(kode);
    if (!row) {
      throw new NotFoundException(`Kotama dengan kode ${kode} tidak ditemukan`);
    }
    return row;
  }
}
