import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadedFileDto {
  filename: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

@Injectable()
export class DokumenService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadDokumen(
    user: JwtUser,
    pinjamanId: string,
    jenis: string,
    file: UploadedFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File dokumen wajib diunggah');
    }

    const pinjaman = await this.prisma.pinjaman.findFirst({
      where: { id: pinjamanId, anggota: { satminkalId: user.satminkalId } },
    });
    if (!pinjaman) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    const relativePath = `/uploads/dokumen/${file.filename}`;

    const doc = await this.prisma.dokumenPinjaman.create({
      data: {
        pinjamanId,
        jenis: jenis || 'Dokumen Pendukung',
        filePath: relativePath,
      },
    });

    return doc;
  }

  async listDokumen(user: JwtUser, pinjamanId: string) {
    const pinjaman = await this.prisma.pinjaman.findFirst({
      where: { id: pinjamanId, anggota: { satminkalId: user.satminkalId } },
    });
    if (!pinjaman) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    return this.prisma.dokumenPinjaman.findMany({
      where: { pinjamanId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async deleteDokumen(user: JwtUser, id: string) {
    const doc = await this.prisma.dokumenPinjaman.findUnique({
      where: { id },
      include: { pinjaman: { include: { anggota: true } } },
    });

    if (!doc || doc.pinjaman.anggota.satminkalId !== user.satminkalId) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    // Unlink file if exists locally
    const absolutePath = path.join(process.cwd(), doc.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.warn(`Gagal menghapus file fisik: ${absolutePath}`, err);
      }
    }

    await this.prisma.dokumenPinjaman.delete({ where: { id } });
    return { message: 'Dokumen berhasil dihapus' };
  }
}
