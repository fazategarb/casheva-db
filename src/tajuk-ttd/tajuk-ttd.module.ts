import { Module } from '@nestjs/common';
import { TajukTtdController } from './tajuk-ttd.controller';
import { TajukTtdService } from './tajuk-ttd.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TajukTtdController],
  providers: [TajukTtdService],
  exports: [TajukTtdService],
})
export class TajukTtdModule {}
