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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TajukTtdService } from './tajuk-ttd.service';
import { CreateTajukTtdDto } from './dto/create-tajuk-ttd.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role, TajukTandaTangan } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Tajuk TTD')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tajuk-ttd')
export class TajukTtdController {
  constructor(private readonly tajukTtdService: TajukTtdService) {}

  @Roles(Role.ADMIN_KOPERASI, Role.BENDAHARA)
  @Post()
  async create(@Body() dto: CreateTajukTtdDto): Promise<TajukTandaTangan> {
    return await this.tajukTtdService.create(dto);
  }

  @Get()
  async findAll(): Promise<TajukTandaTangan[]> {
    return await this.tajukTtdService.findAll();
  }

  @Get('active')
  async findActive(
    @Query('kategori') kategori?: string,
  ): Promise<TajukTandaTangan[]> {
    return await this.tajukTtdService.findActive(kategori);
  }

  @Roles(Role.ADMIN_KOPERASI, Role.BENDAHARA)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTajukTtdDto>,
  ): Promise<TajukTandaTangan> {
    return await this.tajukTtdService.update(id, dto);
  }

  @Roles(Role.ADMIN_KOPERASI)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<TajukTandaTangan> {
    return await this.tajukTtdService.delete(id);
  }
}
