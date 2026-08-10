import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KeuanganService } from './keuangan.service';
import {
  CreateBiayaDto,
  CreatePendapatanDto,
  HitungShuDto,
} from './dto/keuangan.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from 'src/common/interfaces/jwt-user.interface';

@ApiTags('Keuangan & SHU')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('keuangan')
export class KeuanganController {
  constructor(private readonly keuanganService: KeuanganService) {}

  @Post('pendapatan')
  @ApiOperation({ summary: 'Pencatatan pendapatan Kas' })
  createPendapatan(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreatePendapatanDto,
  ) {
    return this.keuanganService.createPendapatan(user, dto);
  }

  @Get('pendapatan')
  @ApiOperation({ summary: 'Daftar pendapatan tahunan' })
  @ApiQuery({ name: 'tahun', required: false, example: 2026 })
  getPendapatan(@CurrentUser() user: JwtUser, @Query('tahun') tahun?: number) {
    return this.keuanganService.listPendapatan(
      user,
      tahun ? Number(tahun) : undefined,
    );
  }

  @Post('biaya')
  @ApiOperation({ summary: 'Pencatatan pengeluaran / biaya Kas' })
  createBiaya(@Body() dto: CreateBiayaDto) {
    return this.keuanganService.createBiaya(dto);
  }

  @Get('biaya')
  @ApiOperation({ summary: 'Daftar pengeluaran biaya tahunan' })
  @ApiQuery({ name: 'tahun', required: false, example: 2026 })
  getBiaya(@Query('tahun') tahun?: number) {
    return this.keuanganService.listBiaya(tahun ? Number(tahun) : undefined);
  }

  @Get('ringkasan/:tahun')
  @ApiOperation({ summary: 'Ringkasan Laba-Rugi / SHU Kotor Tahun Berjalan' })
  getRingkasan(
    @CurrentUser() user: JwtUser,
    @Param('tahun', ParseIntPipe) tahun: number,
  ) {
    return this.keuanganService.ringkasanTahun(user, tahun);
  }

  @Post('shu/hitung')
  @ApiOperation({ summary: 'Kalkulasi & Pembagian SHU Tahunan Anggota' })
  hitungShu(@CurrentUser() user: JwtUser, @Body() dto: HitungShuDto) {
    return this.keuanganService.hitungDanSimpanShu(user, dto);
  }

  @Get('shu/:tahun')
  @ApiOperation({ summary: 'Detail Rincian Pembagian SHU per Tahun' })
  getShuPeriode(@Param('tahun', ParseIntPipe) tahun: number) {
    return this.keuanganService.getPeriodeShu(tahun);
  }
}
