import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatusPinjaman } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import {
  CairkanPinjamanDto,
  CreatePinjamanDto,
  PelunasanDipercepatDto,
  UpdateStatusPinjamanDto,
} from './dto/pinjaman.dto';
import { PinjamanService } from './pinjaman.service';

@ApiTags('Pinjaman & Angsuran')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('pinjaman')
export class PinjamanController {
  constructor(private readonly pinjamanService: PinjamanService) {}

  // -------------------------------------------------------------
  // 1. QUERY / LIST & CREATE ROOT ROUTES
  // -------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'Daftar pinjaman Satminkal' })
  @ApiQuery({ name: 'status', required: false, enum: StatusPinjaman })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: StatusPinjaman,
  ) {
    return this.pinjamanService.findAll(user, status);
  }

  @Post()
  @ApiOperation({ summary: 'Ajukan pinjaman baru' })
  @ApiResponse({
    status: 201,
    description: 'Pengajuan pinjaman berhasil dibuat',
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi gagal / Anggota memiliki pinjaman aktif',
  })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePinjamanDto) {
    return this.pinjamanService.create(user, dto);
  }

  // -------------------------------------------------------------
  // 2. RUTE AKSI KHUSUS / NESTED PARAM (Ditaruh sebelum :id umum)
  // -------------------------------------------------------------

  @Post('angsuran/:angsuranId/bayar')
  @ApiOperation({ summary: 'Bayar angsuran + terbitkan no invoice/kwitansi' })
  @ApiResponse({ status: 200, description: 'Angsuran berhasil dibayar' })
  @ApiResponse({ status: 400, description: 'Angsuran sudah dibayar' })
  @ApiResponse({ status: 404, description: 'Angsuran tidak ditemukan' })
  bayarAngsuran(
    @CurrentUser() user: JwtUser,
    @Param('angsuranId') angsuranId: string,
  ) {
    return this.pinjamanService.bayarAngsuran(user, angsuranId);
  }

  // -------------------------------------------------------------
  // 3. RUTE BERDASARKAN ID PARAMETER (:id)
  // -------------------------------------------------------------

  @Get(':id')
  @ApiOperation({ summary: 'Detail pinjaman + jadwal angsuran' })
  @ApiResponse({ status: 200, description: 'Detail pinjaman ditemukan' })
  @ApiResponse({ status: 404, description: 'Pinjaman tidak ditemukan' })
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.pinjamanService.findOne(user, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ubah status alur persetujuan pinjaman' })
  @ApiResponse({
    status: 200,
    description: 'Status pinjaman berhasil diperbarui',
  })
  @ApiResponse({
    status: 400,
    description: 'Transisi status tidak valid',
  })
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusPinjamanDto,
  ) {
    return this.pinjamanService.updateStatus(user, id, dto);
  }

  @Post(':id/cairkan')
  @ApiOperation({ summary: 'Cairkan pinjaman & buat jadwal angsuran' })
  @ApiResponse({
    status: 201,
    description: 'Pinjaman berhasil dicairkan',
  })
  @ApiResponse({
    status: 400,
    description: 'Pinjaman belum siap dicairkan / Jadwal sudah ada',
  })
  cairkan(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto?: CairkanPinjamanDto,
  ) {
    return this.pinjamanService.cairkan(user, id, dto);
  }

  @Post(':id/pelunasan-dipercepat')
  @ApiOperation({ summary: 'Pelunasan dipercepat untuk sisa seluruh angsuran' })
  @ApiResponse({
    status: 200,
    description: 'Pelunasan dipercepat berhasil diproses',
  })
  @ApiResponse({
    status: 400,
    description: 'Pinjaman belum dicairkan / sisa pokok 0',
  })
  pelunasanDipercepat(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto?: PelunasanDipercepatDto,
  ) {
    return this.pinjamanService.pelunasanDipercepat(user, id, dto);
  }
}
