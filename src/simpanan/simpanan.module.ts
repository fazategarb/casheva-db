import { Module } from '@nestjs/common';
import { SimpananController } from './simpanan.controller';
import { SimpananService } from './simpanan.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SimpananController],
  providers: [SimpananService],
  exports: [SimpananService],
})
export class SimpananModule {}
