import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Inventory,
  Location,
  Device,
  ActivityLog,
  ScanHistory,
  DeviceAlert,
} from '@/entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(ActivityLog)
    private activityRepository: Repository<ActivityLog>,
    @InjectRepository(ScanHistory)
    private scanRepository: Repository<ScanHistory>,
    @InjectRepository(DeviceAlert)
    private alertRepository: Repository<DeviceAlert>,
  ) {}

  async getDashboardStats() {
    // Inventory stats
    const totalItems = await this.inventoryRepository.count();
    const totalLocations = await this.locationRepository.count();
    const totalDevices = await this.deviceRepository.count();

    // Get total inventory value
    const value = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select(`SUM(inv.quantity * inv.price::numeric)`, 'totalValue')
      .getRawOne();

    // Scans today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scansToday = await this.scanRepository
      .createQueryBuilder('scan')
      .where('scan.createdAt >= :today', { today })
      .getCount();

    // Active alerts
    const activeAlerts = await this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.is_resolved = false')
      .getCount();

    // Low stock items
    const lowStockItems = await this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.quantity <= inv.min_quantity')
      .getCount();

    // Device status breakdown
    const deviceStatus = await this.deviceRepository
      .createQueryBuilder('dev')
      .select('dev.status', 'status')
      .addSelect('COUNT(dev.id)', 'count')
      .groupBy('dev.status')
      .getRawMany();

    // Recent activities
    const recentActivities = await this.activityRepository
      .createQueryBuilder('activity')
      .orderBy('activity.created_at', 'DESC')
      .take(10)
      .getMany();

    return {
      overview: {
        totalItems,
        totalLocations,
        totalDevices,
        totalValue: value?.totalValue || 0,
        scansToday,
        activeAlerts,
        lowStockItems,
      },
      deviceStatus,
      recentActivities,
    };
  }

  async getAllStats() {
    // Inventory breakdown by status
    const inventoryByStatus = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select('inv.status', 'status')
      .addSelect('COUNT(inv.id)', 'count')
      .groupBy('inv.status')
      .getRawMany();

    // Location utilization
    const locations = await this.locationRepository
      .createQueryBuilder('loc')
      .select('loc.id')
      .addSelect('loc.name')
      .addSelect('loc.capacity')
      .addSelect('loc.current_items')
      .getMany();

    // Activity by type
    const activityByType = await this.activityRepository
      .createQueryBuilder('activity')
      .select('activity.action_type', 'type')
      .addSelect('COUNT(activity.id)', 'count')
      .groupBy('activity.action_type')
      .getRawMany();

    // Alert severity breakdown
    const alertBySeverity = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(alert.id)', 'count')
      .where('alert.is_resolved = false')
      .groupBy('alert.severity')
      .getRawMany();

    return {
      inventoryByStatus,
      locations,
      activityByType,
      alertBySeverity,
    };
  }
}
