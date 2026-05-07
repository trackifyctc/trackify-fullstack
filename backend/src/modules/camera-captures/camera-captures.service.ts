import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CameraCapture } from '@/entities';

@Injectable()
export class CameraCapturesService {
  constructor(
    @InjectRepository(CameraCapture)
    private cameraCaptureRepository: Repository<CameraCapture>,
  ) {}

  async create(createData: Partial<CameraCapture>): Promise<CameraCapture> {
    const capture = this.cameraCaptureRepository.create(createData);
    return this.cameraCaptureRepository.save(capture);
  }

  async findAll(skip: number = 0, take: number = 20): Promise<any> {
    const [items, total] = await this.cameraCaptureRepository.findAndCount({
      skip,
      take,
      relations: ['device', 'location', 'reviewer'],
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }

  async findById(id: string): Promise<CameraCapture> {
    const capture = await this.cameraCaptureRepository.findOne({
      where: { id },
      relations: ['device', 'location', 'reviewer'],
    });
    if (!capture) {
      throw new NotFoundException('Camera capture not found');
    }
    return capture;
  }

  async update(id: string, updateData: Partial<CameraCapture>): Promise<CameraCapture> {
    const capture = await this.findById(id);
    Object.assign(capture, updateData);
    return this.cameraCaptureRepository.save(capture);
  }

  async delete(id: string): Promise<void> {
    const capture = await this.findById(id);
    await this.cameraCaptureRepository.remove(capture);
  }

  async findAlerts(skip: number = 0, take: number = 20): Promise<any> {
    const [items, total] = await this.cameraCaptureRepository.findAndCount({
      where: { is_alert: true },
      skip,
      take,
      relations: ['device', 'location', 'reviewer'],
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }

  async markReviewed(id: string, reviewedBy: string): Promise<CameraCapture> {
    const capture = await this.findById(id);
    capture.is_reviewed = true;
    capture.reviewed_by = reviewedBy;
    capture.reviewed_at = new Date();
    return this.cameraCaptureRepository.save(capture);
  }

  async getStats(): Promise<any> {
    const total = await this.cameraCaptureRepository.count();
    const alerts = await this.cameraCaptureRepository.count({
      where: { is_alert: true },
    });
    const reviewed = await this.cameraCaptureRepository.count({
      where: { is_reviewed: true },
    });
    const unreviewed = await this.cameraCaptureRepository.count({
      where: { is_reviewed: false },
    });

    const alertsByType = await this.cameraCaptureRepository
      .createQueryBuilder('capture')
      .select('capture.alert_type', 'type')
      .addSelect('COUNT(capture.id)', 'count')
      .where('capture.is_alert = true')
      .groupBy('capture.alert_type')
      .getRawMany();

    return {
      total,
      alerts,
      reviewed,
      unreviewed,
      alertsByType,
    };
  }
}
