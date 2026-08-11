import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { BackupService } from './backup.service';

@ApiTags('Backup & Restore')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  @ApiOperation({ summary: 'Ekspor database backup dalam format JSON' })
  async exportData(@CurrentUser() user: JwtUser, @Res() res: Response) {
    const backupJson = await this.backupService.exportData(user);
    const filename = `backup-koperasi-${user.satminkalId}-${new Date().toISOString().slice(0, 10)}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(JSON.stringify(backupJson, null, 2));
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore database dari payload JSON' })
  async restoreData(@CurrentUser() user: JwtUser, @Body() payload: any) {
    return this.backupService.restoreData(user, payload);
  }
}
