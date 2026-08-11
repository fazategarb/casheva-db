import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PangkatService } from './pangkat.service';

@ApiTags('Master — Pangkat')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('master/pangkat')
export class PangkatController {
  constructor(private readonly pangkatService: PangkatService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar Pangkat (tb_pkt)' })
  findAll() {
    return this.pangkatService.findAll();
  }

  @Get(':kodePkt')
  @ApiOperation({ summary: 'Detail Pangkat by kd_pkt' })
  @ApiParam({ name: 'kodePkt', example: 83 })
  async findByKode(@Param('kodePkt', ParseIntPipe) kodePkt: number) {
    const row = await this.pangkatService.findByKodePkt(kodePkt);
    if (!row) {
      throw new NotFoundException(
        `Pangkat dengan kd_pkt ${kodePkt} tidak ditemukan`,
      );
    }
    return row;
  }
}
