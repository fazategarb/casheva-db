import { Injectable } from '@nestjs/common';
import { TajukTandaTangan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTajukTtdDto } from './dto/create-tajuk-ttd.dto';

@Injectable()
export class TajukTtdService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTajukTtdDto): Promise<TajukTandaTangan> {
    return await this.prisma.tajukTandaTangan.create({
      data: dto,
    });
  }

  async findAll(): Promise<TajukTandaTangan[]> {
    return await this.prisma.tajukTandaTangan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(kategori?: string): Promise<TajukTandaTangan[]> {
    return await this.prisma.tajukTandaTangan.findMany({
      where: {
        isAktif: true,
        ...(kategori ? { kategori } : {}),
      },
    });
  }

  async update(
    id: string,
    dto: Partial<CreateTajukTtdDto>,
  ): Promise<TajukTandaTangan> {
    return await this.prisma.tajukTandaTangan.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<TajukTandaTangan> {
    return await this.prisma.tajukTandaTangan.delete({
      where: { id },
    });
  }
}
