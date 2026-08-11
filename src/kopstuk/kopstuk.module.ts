import { Module } from '@nestjs/common';
import { KopstukController } from './kopstuk.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { KopstukService } from './kopstuk.service';

@Module({
  imports: [PrismaModule],
  controllers: [KopstukController],
  providers: [KopstukService],
  exports: [KopstukService],
})
export class KopstukModule {}
