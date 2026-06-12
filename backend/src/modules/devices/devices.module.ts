import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device, DeviceAlert, ServoCommand } from '@/entities';
import { DevicesService } from './devices.service';
import { ServoService } from './servo.service';
import { DevicesController } from './devices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Device, DeviceAlert, ServoCommand])],
  providers: [DevicesService, ServoService],
  controllers: [DevicesController],
  exports: [DevicesService, ServoService],
})
export class DevicesModule {}
