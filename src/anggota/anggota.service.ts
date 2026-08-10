import { StatusPinjaman } from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { CreateAnggotaDto } from './dto/create-anggota.dto';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';

const anggotaInclude = {
  pangkat: true,
  korps: true,
  satminkal: { include: { kotama: true } },
} as const;

@Injectable()
export class AnggotaService {
  constructor(private readonly prisma: PrismaService) {}

  private scopeSatminkal(user: JwtUser) {
    return user.satminkalId;
  }

  async findAll(user: JwtUser, hanyaAktif?: boolean) {
    return this.prisma.anggota.findMany({
      where: {
        satminkalId: this.scopeSatminkal(user),
        ...(hanyaAktif === true ? { isAktif: true } : {}),
      },
      include: anggotaInclude,
      orderBy: { nama: 'asc' },
    });
  }

  async findOne(user: JwtUser, id: string) {
    const row = await this.prisma.anggota.findFirst({
      where: { id, satminkalId: this.scopeSatminkal(user) },
      include: anggotaInclude,
    });
    if (!row) {
      throw new NotFoundException('Anggota tidak ditemukan');
    }
    return row;
  }

  async create(user: JwtUser, dto: CreateAnggotaDto) {
    await this.assertMasterRefs(dto.pangkatId, dto.korpsId);

    const existingNrp = await this.prisma.anggota.findFirst({
      where: { nrpNip: dto.nrpNip },
    });
    if (existingNrp) {
      throw new ConflictException(
        `Anggota dengan NRP/NIP ${dto.nrpNip} sudah terdaftar`,
      );
    }

    return this.prisma.anggota.create({
      data: {
        nama: dto.nama,
        nrpNip: dto.nrpNip,
        pangkatId: dto.pangkatId,
        korpsId: dto.korpsId,
        satminkalId: this.scopeSatminkal(user),
        tmtAnggota: dto.tmtAnggota ? new Date(dto.tmtAnggota) : undefined,
      },
      include: anggotaInclude,
    });
  }

  async update(user: JwtUser, id: string, dto: UpdateAnggotaDto) {
    await this.findOne(user, id);

    if (dto.pangkatId || dto.korpsId) {
      await this.assertMasterRefs(
        dto.pangkatId ?? (await this.getPangkatId(id)),
        dto.korpsId ?? (await this.getKorpsId(id)),
      );
    }

    return this.prisma.anggota.update({
      where: { id },
      data: {
        nama: dto.nama,
        nrpNip: dto.nrpNip,
        pangkatId: dto.pangkatId,
        korpsId: dto.korpsId,
        isAktif: dto.isAktif,
        tmtAnggota: dto.tmtAnggota ? new Date(dto.tmtAnggota) : undefined,
      },
      include: anggotaInclude,
    });
  }

  async remove(user: JwtUser, id: string) {
    const anggota = await this.findOne(user, id);
    const pinjamanAktif = await this.prisma.pinjaman.count({
      where: {
        anggotaId: id,
        status: { in: [StatusPinjaman.DICAIRKAN] },
      },
    });
    if (pinjamanAktif > 0) {
      throw new ForbiddenException('Anggota masih memiliki pinjaman berjalan');
    }
    await this.prisma.anggota.update({
      where: { id: anggota.id },
      data: { isAktif: false },
    });
    return { message: 'Anggota dinonaktifkan' };
  }

  private async getPangkatId(anggotaId: string) {
    const a = await this.prisma.anggota.findUniqueOrThrow({
      where: { id: anggotaId },
      select: { pangkatId: true },
    });
    return a.pangkatId;
  }

  private async getKorpsId(anggotaId: string) {
    const a = await this.prisma.anggota.findUniqueOrThrow({
      where: { id: anggotaId },
      select: { korpsId: true },
    });
    return a.korpsId;
  }

  private async assertMasterRefs(pangkatId: string, korpsId: string) {
    const [pangkat, korps] = await Promise.all([
      this.prisma.pangkat.findUnique({ where: { id: pangkatId } }),
      this.prisma.korps.findUnique({ where: { id: korpsId } }),
    ]);
    if (!pangkat || !korps) {
      throw new NotFoundException('Pangkat atau Korps tidak valid');
    }
  }
}
