import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { kotama: true, satminkal: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Kredensial tidak valid atau akun tidak aktif.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah.');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      kotamaId: user.kotamaId,
      satminkalId: user.satminkalId,
    };

    return {
      message: 'Login berhasil',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        namaLengkap: user.namaLengkap,
        role: user.role,
        kotama: user.kotama?.nama ?? null,
        satminkal: user.satminkal?.nama ?? null,
      },
    };
  }
}
