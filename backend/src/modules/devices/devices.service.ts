import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceAlert, DeviceStatus, AlertType, AlertSeverity } from '@/entities';
import { RegisterDeviceDto, UpdateDeviceDto, DeviceHeartbeatDto, DeviceAlertDto } from '@/dtos/device.dto';
import * as crypto from 'crypto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(DeviceAlert)
    private alertRepository: Repository<DeviceAlert>,
  ) {}

  generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async registerDevice(registerDeviceDto: RegisterDeviceDto): Promise<Device> {
    const existingSerial = await this.deviceRepository.findOne({
      where: { serial_number: registerDeviceDto.serial_number },
    });
    if (existingSerial) {
      throw new BadRequestException('Device with this serial number already exists');
    }

    const device = this.deviceRepository.create({
      name: registerDeviceDto.name,
      device_type: registerDeviceDto.device_type,
      serial_number: registerDeviceDto.serial_number,
      location_id: registerDeviceDto.location_id,
      firmware_version: registerDeviceDto.firmware_version,
      ip_address: registerDeviceDto.ip_address,
      mac_address: registerDeviceDto.mac_address,
      api_key: this.generateApiKey(),
      status: DeviceStatus.OFFLINE,
    });
    return this.deviceRepository.save(device);
  }

  async findByApiKey(apiKey: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { api_key: apiKey, is_active: true },
    });
    if (!device) {
      throw new UnauthorizedException('Invalid API key');
    }
    return device;
  }

  async findAll(skip: number = 0, take: number = 10): Promise<any> {
    const [items, total] = await this.deviceRepository.findAndCount({
      skip,
      take,
      relations: ['alerts', 'location'],
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }

  async findById(id: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['alerts', 'captures', 'location'],
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findById(id);
    Object.assign(device, updateDeviceDto);
    return this.deviceRepository.save(device);
  }

  async delete(id: string): Promise<void> {
    const device = await this.findById(id);
    await this.deviceRepository.remove(device);
  }

  async updateHeartbeat(deviceId: string, heartbeatDto: DeviceHeartbeatDto): Promise<Device> {
    const device = await this.findById(deviceId);
    
    device.last_heartbeat = new Date();
    if (heartbeatDto.status) {
      device.status = heartbeatDto.status as DeviceStatus;
    } else {
      device.status = DeviceStatus.ONLINE;
    }
    if (heartbeatDto.ip_address) {
      device.ip_address = heartbeatDto.ip_address;
    }

    return this.deviceRepository.save(device);
  }

  async createAlert(deviceId: string, alertDto: DeviceAlertDto): Promise<DeviceAlert> {
    const device = await this.findById(deviceId);
    
    const alert = this.alertRepository.create({
      device_id: deviceId,
      alert_type: alertDto.alert_type as AlertType,
      severity: alertDto.severity as AlertSeverity,
      title: alertDto.title,
      message: alertDto.message,
      data: alertDto.data,
    });

    return this.alertRepository.save(alert);
  }

  async getAlerts(deviceId: string, skip: number = 0, take: number = 10): Promise<any> {
    await this.findById(deviceId);

    const [items, total] = await this.alertRepository.findAndCount({
      where: { device_id: deviceId },
      skip,
      take,
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<DeviceAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.is_acknowledged = true;
    alert.acknowledged_by = userId;
    alert.acknowledged_at = new Date();

    return this.alertRepository.save(alert);
  }

  async resolveAlert(alertId: string): Promise<DeviceAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
    });
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    alert.is_resolved = true;
    alert.resolved_at = new Date();

    return this.alertRepository.save(alert);
  }

  async regenerateApiKey(deviceId: string): Promise<Device> {
    const device = await this.findById(deviceId);
    device.api_key = this.generateApiKey();
    return this.deviceRepository.save(device);
  }

  async getStats(): Promise<any> {
    const total = await this.deviceRepository.count();
    const byStatus = await this.deviceRepository
      .createQueryBuilder('dev')
      .select('dev.status', 'status')
      .addSelect('COUNT(dev.id)', 'count')
      .groupBy('dev.status')
      .getRawMany();

    const totalAlerts = await this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.is_resolved = false')
      .getCount();

    const unacknowledgedAlerts = await this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.is_acknowledged = false')
      .getCount();

    return {
      total,
      byStatus,
      totalAlerts,
      unacknowledgedAlerts,
    };
  }
}
