import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '@/entities';
import { CreateLocationDto, UpdateLocationDto } from '@/dtos/location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    const existingCode = await this.locationRepository.findOne({
      where: { code: createLocationDto.code },
    });
    if (existingCode) {
      throw new BadRequestException('Location code already exists');
    }

    const location = this.locationRepository.create(createLocationDto);
    return this.locationRepository.save(location);
  }

  async findAll(skip: number = 0, take: number = 10): Promise<any> {
    const [items, total] = await this.locationRepository.findAndCount({
      skip,
      take,
      relations: ['items'],
    });

    return { items, total };
  }

  async findById(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    return location;
  }

  async update(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findById(id);
    Object.assign(location, updateLocationDto);
    return this.locationRepository.save(location);
  }

  async delete(id: string): Promise<void> {
    const location = await this.findById(id);
    await this.locationRepository.remove(location);
  }

  async getStats(): Promise<any> {
    const total = await this.locationRepository.count();
    const qb = this.locationRepository.createQueryBuilder('loc');
    const occupied = await qb
      .where('loc.current_items > 0')
      .getCount();

    const capacityStats = await this.locationRepository
      .createQueryBuilder('loc')
      .select('AVG(loc.current_items)', 'avgItems')
      .addSelect('SUM(loc.current_items)', 'totalItems')
      .addSelect('SUM(loc.capacity)', 'totalCapacity')
      .getRawOne();

    return {
      total,
      occupied,
      avgItems: capacityStats?.avgItems || 0,
      totalItems: capacityStats?.totalItems || 0,
      totalCapacity: capacityStats?.totalCapacity || 0,
    };
  }

  async getLocationItems(id: string): Promise<Location> {
    const location = await this.findById(id);
    return location;
  }
}
