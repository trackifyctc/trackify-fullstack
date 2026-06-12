import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServoCommand, ServoDirection } from '@/entities';
import { CreateServoCommandDto } from '@/dtos/servo-command.dto';

@Injectable()
export class ServoService {
  constructor(
    @InjectRepository(ServoCommand)
    private servoCommandRepository: Repository<ServoCommand>,
  ) {}

  async executeServoCommand(
    deviceId: string,
    dto: CreateServoCommandDto,
    userId: string,
  ): Promise<ServoCommand> {
    const command = this.servoCommandRepository.create({
      device_id: deviceId,
      direction: dto.direction,
      angle: dto.angle || this.getDefaultAngle(dto.direction),
      command_data: dto.command_data,
      executed_by: userId,
      status: 'pending',
    });

    return this.servoCommandRepository.save(command);
  }

  async createCommand(dto: CreateServoCommandDto, userId: string): Promise<ServoCommand> {
    const command = this.servoCommandRepository.create({
      device_id: dto.device_id,
      direction: dto.direction,
      angle: dto.angle || this.getDefaultAngle(dto.direction),
      command_data: dto.command_data,
      executed_by: userId,
      status: 'pending',
    });

    return this.servoCommandRepository.save(command);
  }

  async executeCommand(commandId: string): Promise<ServoCommand> {
    const command = await this.servoCommandRepository.findOne({
      where: { id: commandId },
      relations: ['device'],
    });

    if (!command) {
      throw new NotFoundException('Command not found');
    }

    command.status = 'processing';
    command.executed_at = new Date();
    return this.servoCommandRepository.save(command);
  }

  async markAsExecuted(
    commandId: string,
    responseData?: any,
    status: 'success' | 'failed' = 'success',
    errorMessage?: string,
  ): Promise<ServoCommand> {
    const command = await this.servoCommandRepository.findOne({
      where: { id: commandId },
    });

    if (!command) {
      throw new NotFoundException('Command not found');
    }

    command.is_executed = true;
    command.status = status;
    command.response_data = JSON.stringify(responseData || {});
    if (errorMessage) {
      command.error_message = errorMessage;
    }

    return this.servoCommandRepository.save(command);
  }

  async getCommandHistory(deviceId: string, limit: number = 50): Promise<ServoCommand[]> {
    return this.servoCommandRepository.find({
      where: { device_id: deviceId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getLastCommandByDirection(
    deviceId: string,
    direction: ServoDirection,
  ): Promise<ServoCommand | null> {
    return this.servoCommandRepository.findOne({
      where: { device_id: deviceId, direction },
      order: { created_at: 'DESC' },
    });
  }

  async getPendingCommand(
    deviceId: string,
  ): Promise<ServoCommand | null> {

    return this.servoCommandRepository.findOne({
      where: {
        device_id: deviceId,
        status: 'pending',
      },
      order: {
        created_at: 'ASC',
      },
    });

  }
  
  private getDefaultAngle(direction: ServoDirection): number {
    const angles: Record<ServoDirection, number> = {
      [ServoDirection.UP]: 30,
      [ServoDirection.DOWN]: -30,
      [ServoDirection.LEFT]: -30,
      [ServoDirection.RIGHT]: 30,
      [ServoDirection.RESET]: 0,
    };
    return angles[direction];
  }

  async getStats(deviceId: string): Promise<{ total: number; pending: number; success: number; failed: number }> {
    const [total, pending, success, failed] = await Promise.all([
      this.servoCommandRepository.count({ where: { device_id: deviceId } }),
      this.servoCommandRepository.count({ where: { device_id: deviceId, status: 'pending' } }),
      this.servoCommandRepository.count({ where: { device_id: deviceId, status: 'success' } }),
      this.servoCommandRepository.count({ where: { device_id: deviceId, status: 'failed' } }),
    ]);

    return { total, pending, success, failed };
  }
  
}