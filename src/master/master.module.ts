import { Module } from '@nestjs/common';
import { KotamaController } from './kotama/kotama.controller';
import { KotamaService } from './kotama/kotama.service';
import { SatminkalController } from './satminkal/satminkal.controller';
import { SatminkalService } from './satminkal/satminkal.service';
import { PangkatController } from './pangkat/pangkat.controller';
import { PangkatService } from './pangkat/pangkat.service';
import { KorpsController } from './korps/korps.controller';
import { KorpsService } from './korps/korps.service';

@Module({
  controllers: [
    KotamaController,
    SatminkalController,
    PangkatController,
    KorpsController,
  ],
  providers: [KotamaService, SatminkalService, PangkatService, KorpsService],
  exports: [KotamaService, SatminkalService, PangkatService, KorpsService],
})
export class MasterModule {}
