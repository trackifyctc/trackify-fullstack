import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CameraCapture } from '@/entities';
import { CameraCapturesService } from './camera-captures.service';
import { CameraCapturesController } from './camera-captures.controller';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [TypeOrmModule.forFeature([CameraCapture]), DevicesModule],
  providers: [CameraCapturesService],
  controllers: [CameraCapturesController],
  exports: [CameraCapturesService],
})
export class CameraCapturesModule {}
