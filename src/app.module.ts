import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MasterModule } from './master/master.module';
import { AnggotaModule } from './anggota/anggota.module';
import { PinjamanModule } from './pinjaman/pinjaman.module';
import { SimpananModule } from './simpanan/simpanan.module';
import { UsersModule } from './users/users.module';
import { KeuanganModule } from './keuangan/keuangan.module';
import { TajukTtdModule } from './tajuk-ttd/tajuk-ttd.module';
import { KopstukModule } from './kopstuk/kopstuk.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DokumenModule } from './dokumen/dokumen.module';
import { ReportsModule } from './reports/reports.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MasterModule,
    AnggotaModule,
    PinjamanModule,
    SimpananModule,
    UsersModule,
    KeuanganModule,
    TajukTtdModule,
    KopstukModule,
    DashboardModule,
    DokumenModule,
    ReportsModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
