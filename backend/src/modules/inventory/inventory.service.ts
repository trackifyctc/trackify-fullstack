import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, InventoryStatus, ActionType } from '@/entities';
import { CreateInventoryDto, UpdateInventoryDto } from '@/dtos/inventory.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private activityService: ActivityService,
  ) {}

  async create(createInventoryDto: CreateInventoryDto, userId?: string): Promise<Inventory> {
    const existingSku = await this.inventoryRepository.findOne({
      where: { sku: createInventoryDto.sku },
    });
    if (existingSku) {
      throw new BadRequestException('SKU already exists');
    }

    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      status: InventoryStatus.TERSEDIA,
    });
    const saved = await this.inventoryRepository.save(inventory);

    // Create activity log
    try {
      await this.activityService.createActivityLog(
        saved.id,
        `Item created: ${saved.name}`,
        ActionType.CREATE,
        userId,
        { sku: saved.sku, category: saved.category },
      );
    } catch (err) {
      console.error('Error creating activity log:', err);
      // Don't fail the operation if logging fails
    }

    return this.inventoryRepository.findOne({
      where: { id: saved.id },
      relations: ['location'],
    });
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    query?: string,
    category?: string,
    status?: string,
  ): Promise<any> {
    const qb = this.inventoryRepository.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.location', 'location');

    if (query) {
      qb.where(
        'inventory.name ILIKE :query OR inventory.sku ILIKE :query OR inventory.barcode ILIKE :query',
        { query: `%${query}%` },
      );
    }

    if (category) {
      qb.andWhere('inventory.category = :category', { category });
    }

    if (status) {
      qb.andWhere('inventory.status = :status', { status });
    }

    const total = await qb.getCount();
    const items = await qb.skip(skip).take(take).getMany();

    return { items, total };
  }

  async findById(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['location'],
    });
    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }
    return inventory;
  }

  async findByBarcode(barcode: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { barcode },
      relations: ['location'],
    });
    if (!inventory) {
      throw new NotFoundException('Inventory item with this barcode not found');
    }
    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto, userId?: string): Promise<Inventory> {
    const inventory = await this.findById(id);
    const originalData = { ...inventory };
    
    Object.assign(inventory, updateInventoryDto);
    const updated = await this.inventoryRepository.save(inventory);

    // Create activity log
    try {
      const changes = Object.entries(updateInventoryDto)
        .reduce((acc, [key, value]) => {
          if (value !== undefined && originalData[key] !== value) {
            acc[key] = { from: originalData[key], to: value };
          }
          return acc;
        }, {});

      await this.activityService.createActivityLog(
        id,
        `Item updated: ${updated.name}`,
        ActionType.UPDATE,
        userId,
        changes,
      );
    } catch (err) {
      console.error('Error creating activity log:', err);
      // Don't fail the operation if logging fails
    }

    // Return with location relation loaded
    return this.inventoryRepository.findOne({
      where: { id: updated.id },
      relations: ['location'],
    });
  }

  async delete(id: string, userId?: string): Promise<void> {
    const inventory = await this.findById(id);
    
    try {
      await this.activityService.createActivityLog(
        id,
        `Item deleted: ${inventory.name}`,
        ActionType.DELETE,
        userId,
        { sku: inventory.sku, name: inventory.name },
      );
    } catch (err) {
      console.error('Error creating activity log:', err);
      // Don't fail the operation if logging fails
    }

    await this.inventoryRepository.remove(inventory);
  }

  async getStats(): Promise<any> {
    const total = await this.inventoryRepository.count();
    const byStatus = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select('inv.status', 'status')
      .addSelect('COUNT(inv.id)', 'count')
      .groupBy('inv.status')
      .getRawMany();

    const totalValue = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select(`SUM(inv.quantity * inv.price::numeric)`, 'totalValue')
      .getRawOne();

    return {
      total,
      byStatus,
      totalValue: totalValue?.totalValue || 0,
    };
  }

  async getCategories(): Promise<string[]> {
    const result = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select('DISTINCT inv.category', 'category')
      .where('inv.category IS NOT NULL')
      .getRawMany();

    return result.map((r) => r.category);
  }
}
