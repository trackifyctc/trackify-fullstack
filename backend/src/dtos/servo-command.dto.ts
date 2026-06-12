import { IsEnum, IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';
import { ServoDirection } from '@/entities';

export class CreateServoCommandDto {
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @IsEnum(ServoDirection)
  @IsNotEmpty()
  direction: ServoDirection;

  @IsNumber()
  @IsOptional()
  angle?: number;

  @IsString()
  @IsOptional()
  command_data?: string;
}

export class ServoCommandResponseDto {
  id: string;
  device_id: string;
  direction: ServoDirection;
  angle: number;
  is_executed: boolean;
  status: 'pending' | 'processing' | 'success' | 'failed';
  created_at: Date;
  executed_at?: Date;
}