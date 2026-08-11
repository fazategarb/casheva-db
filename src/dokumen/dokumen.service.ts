import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

export interface UploadedFileDto {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

@Injectable()
export class DokumenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadDokumen(
    user: JwtUser,
    pinjamanId: string,
    jenis: string,
    file: UploadedFileDto,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File dokumen wajib diunggah');
    }

    const pinjaman = await this.prisma.pinjaman.findFirst({
      where: { id: pinjamanId, anggota: { satminkalId: user.satminkalId } },
    });
    if (!pinjaman) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    // Stream upload directly to Cloudinary
    const cloudinaryRes = await this.cloudinaryService.uploadFile(
      file,
      'casheva/dokumen',
    );
    const fileUrl = cloudinaryRes.secure_url || cloudinaryRes.url;

    const doc = await this.prisma.dokumenPinjaman.create({
      data: {
        pinjamanId,
        jenis: jenis || 'Dokumen Pendukung',
        filePath: fileUrl,
      },
    });

    return {
      ...doc,
      cloudinary: {
        publicId: cloudinaryRes.public_id,
        bytes: cloudinaryRes.bytes,
        format: cloudinaryRes.format,
      },
    };
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

    // Jika filePath adalah URL Cloudinary, ekstrak public_id dan hapus dari Cloudinary
    if (doc.filePath && doc.filePath.includes('cloudinary.com')) {
      try {
        const parts = doc.filePath.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1) {
          const folderAndFile = parts.slice(uploadIndex + 2).join('/');
          const publicId = folderAndFile.substring(
            0,
            folderAndFile.lastIndexOf('.'),
          );
          if (publicId) {
            await this.cloudinaryService.deleteFile(publicId);
          }
        }
      } catch (err) {
        console.warn(
          `Gagal menghapus file dari Cloudinary: ${doc.filePath}`,
          err,
        );
      }
    }

    await this.prisma.dokumenPinjaman.delete({ where: { id } });
    return { message: 'Dokumen berhasil dihapus' };
  }
}
