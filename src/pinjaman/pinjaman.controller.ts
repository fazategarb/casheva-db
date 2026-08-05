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
import { StatusPinjaman } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import {
  CairkanPinjamanDto,
  CreatePinjamanDto,
  UpdateStatusPinjamanDto,
} from './dto/pinjaman.dto';
import { PinjamanService } from './pinjaman.service';

@ApiTags('Pinjaman & Angsuran')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('pinjaman')
export class PinjamanController {
  constructor(private readonly pinjamanService: PinjamanService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar pinjaman Satminkal' })
  @ApiQuery({ name: 'status', required: false, enum: StatusPinjaman })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: StatusPinjaman,
  ) {
    return this.pinjamanService.findAll(user, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pinjaman + jadwal angsuran' })
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.pinjamanService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Ajukan pinjaman baru' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePinjamanDto) {
    return this.pinjamanService.create(user, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ubah status alur persetujuan pinjaman' })
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusPinjamanDto,
  ) {
    return this.pinjamanService.updateStatus(user, id, dto);
  }

  @Post(':id/cairkan')
  @ApiOperation({ summary: 'Cairkan pinjaman & buat jadwal angsuran' })
  cairkan(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: CairkanPinjamanDto,
  ) {
    return this.pinjamanService.cairkan(user, id, dto);
  }

  @Post('angsuran/:angsuranId/bayar')
  @ApiOperation({ summary: 'Bayar angsuran + terbitkan no invoice/kwitansi' })
  bayarAngsuran(
    @CurrentUser() user: JwtUser,
    @Param('angsuranId') angsuranId: string,
  ) {
    return this.pinjamanService.bayarAngsuran(user, angsuranId);
  }
}
