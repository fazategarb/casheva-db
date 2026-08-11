import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { ReportsService } from './reports.service';

@ApiTags('Reports / Cetakan')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('anggota')
  @ApiOperation({ summary: 'Laporan Cetak Daftar Anggota Koperasi (Lampiran II)' })
  getReportAnggota(@CurrentUser() user: JwtUser) {
    return this.reportsService.getReportAnggota(user);
  }

  @Get('brosur-pinjaman')
  @ApiOperation({ summary: 'Brosur Matriks Pinjaman Koperasi (Lampiran III)' })
  getBrosurPinjaman() {
    return this.reportsService.getBrosurPinjaman();
  }

  @Get('rekap-simpanan')
  @ApiOperation({ summary: 'Laporan Rekap Simpanan Anggota (Lampiran IV)' })
  getRekapSimpanan(@CurrentUser() user: JwtUser) {
    return this.reportsService.getRekapSimpanan(user);
  }

  @Get('pinjaman-anggota')
  @ApiOperation({ summary: 'Daftar Anggota Meminjam (Lampiran V)' })
  @ApiQuery({ name: 'tahun', required: false, type: Number })
  getPinjamanAnggota(
    @CurrentUser() user: JwtUser,
    @Query('tahun') tahun?: string,
  ) {
    const t = tahun ? parseInt(tahun, 10) : undefined;
    return this.reportsService.getPinjamanAnggota(user, t);
  }

  @Get('akad-kredit/:pinjamanId')
  @ApiOperation({ summary: 'Resume / Akad Kredit Pinjaman (Lampiran VI)' })
  getAkadKredit(
    @CurrentUser() user: JwtUser,
    @Param('pinjamanId') pinjamanId: string,
  ) {
    return this.reportsService.getAkadKredit(user, pinjamanId);
  }

  @Get('kwitansi/:angsuranId')
  @ApiOperation({ summary: 'Kwitansi / Invoice Pembayaran Angsuran (Lampiran VII)' })
  getKwitansi(
    @CurrentUser() user: JwtUser,
    @Param('angsuranId') angsuranId: string,
  ) {
    return this.reportsService.getKwitansi(user, angsuranId);
  }

  @Get('rekap-kwitansi-bulanan')
  @ApiOperation({ summary: 'Rekap Kwitansi Bulanan (Lampiran VIII)' })
  @ApiQuery({ name: 'tahun', required: false, type: Number })
  @ApiQuery({ name: 'bulan', required: false, type: Number })
  getRekapKwitansiBulanan(
    @CurrentUser() user: JwtUser,
    @Query('tahun') tahun?: string,
    @Query('bulan') bulan?: string,
  ) {
    const t = tahun ? parseInt(tahun, 10) : undefined;
    const b = bulan ? parseInt(bulan, 10) : undefined;
    return this.reportsService.getRekapKwitansiBulanan(user, t, b);
  }

  @Get('shu-anggota/:tahun')
  @ApiOperation({ summary: 'Laporan SHU Anggota Koperasi (Lampiran IX)' })
  getShuAnggota(
    @CurrentUser() user: JwtUser,
    @Param('tahun') tahun: string,
  ) {
    return this.reportsService.getShuAnggota(user, parseInt(tahun, 10));
  }
}
