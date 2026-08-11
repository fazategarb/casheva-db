import {
  Body,
  Controller,
  Delete,
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
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnggotaService } from './anggota.service';
import type { JwtUser } from 'src/common/interfaces/jwt-user.interface';
import { CreateAnggotaDto } from './dto/create-anggota.dto';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';

@ApiTags('Anggota Koperasi')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('anggota')
export class AnggotaController {
  constructor(private readonly anggotaService: AnggotaService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar anggota di Satminkal session user' })
  @ApiQuery({ name: 'hanyaAktif', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('hanyaAktif') hanyaAktif?: string,
  ) {
    return this.anggotaService.findAll(user, hanyaAktif === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail anggota' })
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.anggotaService.findOne(user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah anggota baru' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateAnggotaDto) {
    return this.anggotaService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah data anggota' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateAnggotaDto,
  ) {
    return this.anggotaService.update(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Nonaktifkan anggota (soft delete)' })
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.anggotaService.remove(user, id);
  }
}
