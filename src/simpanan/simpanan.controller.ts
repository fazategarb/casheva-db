import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { SimpananMassalDto } from './dto/simpanan-massal.dto';
import { SimpananService } from './simpanan.service';

@ApiTags('Simpanan')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('simpanan')
export class SimpananController {
  constructor(private readonly simpananService: SimpananService) {}

  @Get('rekap')
  @ApiOperation({ summary: 'Rekap simpanan per anggota aktif (Satminkal)' })
  rekap(@CurrentUser() user: JwtUser) {
    return this.simpananService.rekapSatminkal(user);
  }

  @Get('anggota/:anggotaId')
  @ApiOperation({ summary: 'Riwayat simpanan satu anggota' })
  byAnggota(
    @CurrentUser() user: JwtUser,
    @Param('anggotaId') anggotaId: string,
  ) {
    return this.simpananService.listByAnggota(user, anggotaId);
  }

  @Post('pokok-wajib/:anggotaId')
  @ApiOperation({
    summary: 'Catat simpanan pokok (50rb) & wajib (100rb) pertama kali',
  })
  pokokWajib(
    @CurrentUser() user: JwtUser,
    @Param('anggotaId') anggotaId: string,
  ) {
    return this.simpananService.setPokokWajib(user, anggotaId);
  }

  @Post('sukarela/massal')
  @ApiOperation({
    summary: 'Input simpanan sukarela serempak seluruh anggota aktif',
  })
  sukarelaMassal(@CurrentUser() user: JwtUser, @Body() dto: SimpananMassalDto) {
    return this.simpananService.sukarelaMassal(user, dto);
  }
}
