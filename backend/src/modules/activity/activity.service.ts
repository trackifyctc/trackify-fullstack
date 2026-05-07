import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ScanHistory, ActionType, ScanType } from '@/entities';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(ScanHistory)
    private scanHistoryRepository: Repository<ScanHistory>,
  ) {}

  async createActivityLog(
    inventoryItemId: string,
    action: string,
    actionType: ActionType,
    userId?: string,
    details?: any,
  ): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create({
      inventory_item_id: inventoryItemId,
      action,
      action_type: actionType,
      user_id: userId,
      details,
    });

    return this.activityLogRepository.save(activityLog);
  }

  async createScanHistory(
    inventoryItemId: string,
    scanType: ScanType,
    scannedData?: string,
    deviceId?: string,
    userId?: string,
  ): Promise<ScanHistory> {
    const scanHistory = this.scanHistoryRepository.create({
      inventory_item_id: inventoryItemId,
      scan_type: scanType,
      scanned_data: scannedData,
      device_id: deviceId,
      user_id: userId,
    });

    return this.scanHistoryRepository.save(scanHistory);
  }

  async getActivityLogs(skip: number = 0, take: number = 20): Promise<any> {
    const [items, total] = await this.activityLogRepository.findAndCount({
      skip,
      take,
      relations: ['inventory_item', 'user', 'location'],
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }

  async getScanHistory(
    inventoryItemId?: string,
    skip: number = 0,
    take: number = 20,
  ): Promise<any> {
    const queryBuilder = this.scanHistoryRepository
      .createQueryBuilder('scan')
      .leftJoinAndSelect('scan.inventory_item', 'inventory')
      .leftJoinAndSelect('scan.device', 'device')
      .leftJoinAndSelect('scan.user', 'user')
      .leftJoinAndSelect('scan.location', 'location')
      .orderBy('scan.created_at', 'DESC')
      .skip(skip)
      .take(take);

    if (inventoryItemId) {
      queryBuilder.where('scan.inventory_item_id = :inventoryItemId', { inventoryItemId });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async getRecentActivities(limit: number = 50): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      relations: ['inventory_item', 'user', 'location'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getAlertActivities(skip: number = 0, take: number = 20): Promise<any> {
    const [items, total] = await this.activityLogRepository.findAndCount({
      where: { is_alert: true },
      skip,
      take,
      relations: ['inventory_item', 'user', 'location'],
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }

  async getStats(): Promise<any> {
    const totalActivities = await this.activityLogRepository.count();
    const totalScans = await this.scanHistoryRepository.count();

    const activityByType = await this.activityLogRepository
      .createQueryBuilder('log')
      .select('log.action_type', 'type')
      .addSelect('COUNT(log.id)', 'count')
      .groupBy('log.action_type')
      .getRawMany();

    const scansByType = await this.scanHistoryRepository
      .createQueryBuilder('scan')
      .select('scan.scan_type', 'type')
      .addSelect('COUNT(scan.id)', 'count')
      .groupBy('scan.scan_type')
      .getRawMany();

    return {
      totalActivities,
      totalScans,
      activityByType,
      scansByType,
    };
  }

  async getActivityStats(inventoryItemId: string): Promise<any> {
    const activities = await this.activityLogRepository.count({
      where: { inventory_item_id: inventoryItemId },
    });

    const scans = await this.scanHistoryRepository.count({
      where: { inventory_item_id: inventoryItemId },
    });

    const lastActivity = await this.activityLogRepository.findOne({
      where: { inventory_item_id: inventoryItemId },
      order: { created_at: 'DESC' },
    });

    const lastScan = await this.scanHistoryRepository.findOne({
      where: { inventory_item_id: inventoryItemId },
      order: { created_at: 'DESC' },
    });

    return {
      activities,
      scans,
      lastActivity: lastActivity?.created_at,
      lastScan: lastScan?.created_at,
    };
  }
}
