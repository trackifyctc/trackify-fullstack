import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;
}

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;
}

export class LocationResponseDto {
  id: string;
  name: string;
  code: string;
  floor: string;
  zone: string;
  capacity: number;
  current_items: number;
  is_active: boolean;
  created_at: Date;
}
