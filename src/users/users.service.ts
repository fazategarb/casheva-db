import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('Username sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        namaLengkap: dto.namaLengkap,
        role: dto.role,
        kotama: { connect: { id: dto.kotamaId } },
        satminkal: { connect: { id: dto.satminkalId } },
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        kotamaId: true,
        satminkalId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        kotama: { select: { id: true, kode: true, nama: true } },
        satminkal: { select: { id: true, kode: true, nama: true } },
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        kotamaId: true,
        satminkalId: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.username !== undefined) updateData.username = dto.username;
    if (dto.namaLengkap !== undefined) updateData.namaLengkap = dto.namaLengkap;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.kotamaId) {
      updateData.kotama = { connect: { id: dto.kotamaId } };
    }

    if (dto.satminkalId) {
      updateData.satminkal = { connect: { id: dto.satminkalId } };
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string): Promise<Pick<User, 'id' | 'isActive'>> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        isActive: true,
      },
    });
  }
}
