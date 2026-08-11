import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
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
import type { Response } from 'express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { DokumenService } from './dokumen.service';

const uploadDir = path.join(process.cwd(), 'uploads', 'dokumen');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Dokumen Pinjaman')
@ApiBearerAuth('JWT-auth')
@Controller('dokumen')
export class DokumenController {
  constructor(private readonly dokumenService: DokumenService) {}

  @Post('pinjaman/:pinjamanId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Upload dokumen pengajuan pinjaman' })
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
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `doc-${uniqueSuffix}${ext}`);
        },
      }),
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
  @ApiOperation({ summary: 'Hapus dokumen pinjaman' })
  async delete(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.dokumenService.deleteDokumen(user, id);
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Download atau lihat file dokumen' })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File dokumen tidak ditemukan' });
    }
    return res.sendFile(filePath);
  }
}
