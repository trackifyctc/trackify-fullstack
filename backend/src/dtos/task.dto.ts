import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  completed?: boolean;
}

export class TaskResponseDto {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}
