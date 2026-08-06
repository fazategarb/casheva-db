import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MasterModule } from './master/master.module';
import { PinjamanModule } from './pinjaman/pinjaman.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MasterModule,
    PinjamanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
