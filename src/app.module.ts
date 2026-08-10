import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MasterModule } from './master/master.module';
import { PinjamanModule } from './pinjaman/pinjaman.module';
import { SimpananModule } from './simpanan/simpanan.module';
import { UsersModule } from './users/users.module';
import { KeuanganModule } from './keuangan/keuangan.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MasterModule,
    PinjamanModule,
    SimpananModule,
    UsersModule,
    KeuanganModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
