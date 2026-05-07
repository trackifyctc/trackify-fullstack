import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { DeviceType } from '@/entities';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(DeviceType)
  @Transform(({ value }) => value?.toLowerCase?.() || value)
  device_type: DeviceType;

  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @IsUUID()
  @IsOptional()
  location_id?: string;

  @IsString()
  @IsOptional()
  firmware_version?: string;

  @IsString()
  @IsOptional()
  ip_address?: string;

  @IsString()
  @IsOptional()
  mac_address?: string;
}

export class UpdateDeviceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  location_id?: string;

  @IsString()
  @IsOptional()
  firmware_version?: string;
}

export class DeviceHeartbeatDto {
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase?.() || value)
  status?: string;

  @IsOptional()
  ip_address?: string;
}

export class DeviceAlertDto {
  @IsString()
  @IsNotEmpty()
  alert_type: string;

  @IsString()
  @IsNotEmpty()
  severity: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  data?: any;
}

export class DeviceResponseDto {
  id: string;
  name: string;
  device_type: string;
  serial_number: string;
  api_key: string;
  status: string;
  last_heartbeat: Date;
  is_active: boolean;
  created_at: Date;
}
