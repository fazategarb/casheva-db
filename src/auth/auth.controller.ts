import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface RequestWithUser extends Express.Request {
  user: {
    userId: string;
    username: string;
    role: string;
    kotamaId: string;
    satminkalId: string;
  };
}

@ApiTags('Autentikasi & Session')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login Pengurus / Pimpinan' })
  @ApiResponse({
    status: 200,
    description:
      'Login berhasil dan mengembalikan token JWT berserta session Kotama/Satminkal.',
  })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid.' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Mendapatkan profil & session user aktif' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }
}
