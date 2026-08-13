import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KopstukService } from './kopstuk.service';
import { CreateKopstukDto } from './dto/create-kopstuk.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Kopstuk')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('kopstuk')
export class KopstukController {
  constructor(private readonly kopstukService: KopstukService) {}

  @Roles(Role.ADMIN_KOPERASI, Role.BENDAHARA)
  @Post(':satminkalId')
  async saveKopstuk(
    @Param('satminkalId') satminkalId: string,
    @Body() dto: CreateKopstukDto,
  ) {
    return this.kopstukService.upsertBySatminkal(satminkalId, dto);
  }

  @Get(':satminkalId')
  async getKopstuk(@Param('satminkalId') satminkalId: string) {
    return this.kopstukService.getBySatminkal(satminkalId);
  }
}
