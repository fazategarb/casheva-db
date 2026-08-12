import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { DokumenService } from './dokumen.service';

@ApiTags('Dokumen Pinjaman')
@ApiBearerAuth('JWT-auth')
@Controller('dokumen')
export class DokumenController {
  constructor(private readonly dokumenService: DokumenService) {}

  @Post('pinjaman/:pinjamanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Upload dokumen pengajuan pinjaman ke Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        jenis: { type: 'string', example: 'Surat Permohonan Usipa' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  async upload(
    @CurrentUser() user: JwtUser,
    @Param('pinjamanId') pinjamanId: string,
    @Body('jenis') jenis: string,
    @UploadedFile() file: any,
  ) {
    return this.dokumenService.uploadDokumen(user, pinjamanId, jenis, file);
  }

  @Get('pinjaman/:pinjamanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List dokumen untuk pinjaman tertentu' })
  async list(
    @CurrentUser() user: JwtUser,
    @Param('pinjamanId') pinjamanId: string,
  ) {
    return this.dokumenService.listDokumen(user, pinjamanId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Hapus dokumen pinjaman dari Cloudinary & NeonDB' })
  async delete(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.dokumenService.deleteDokumen(user, id);
  }
}
