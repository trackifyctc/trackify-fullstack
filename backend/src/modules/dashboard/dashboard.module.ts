import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Inventory,
  Location,
  Device,
  ActivityLog,
  ScanHistory,
  DeviceAlert,
} from '@/entities';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      Location,
      Device,
      ActivityLog,
      ScanHistory,
      DeviceAlert,
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
