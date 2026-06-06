import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CameraCapture } from '@/entities';
import axios from 'axios';

@Injectable()
export class CameraCapturesService {
  constructor(
    @InjectRepository(CameraCapture)
    private cameraCaptureRepository: Repository<CameraCapture>,
  ) {}

  async create(createData: Partial<CameraCapture>) {

    console.log('VIDEO URL MASUK:', createData.video_url);

    const capture =
      this.cameraCaptureRepository.create(createData);

    console.log('SETELAH CREATE:', capture.video_url);

    const savedCapture =
      await this.cameraCaptureRepository.save(capture);

    console.log('SETELAH SAVE:', savedCapture.video_url);

    await this.sendTelegramNotification(savedCapture);

    return savedCapture;
  }

  async findAll(filters: any): Promise<any> {
    console.log('MASUK FINDALL');
    console.log(filters);
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 12;

    const qb = this.cameraCaptureRepository
      .createQueryBuilder('capture')
      .leftJoinAndSelect('capture.device', 'device')
      .leftJoinAndSelect('capture.location', 'location')
      .leftJoinAndSelect('capture.reviewer', 'reviewer');

    if (filters.start_date) {
      qb.andWhere(
        'DATE(capture.created_at) >= :startDate',
        {
          startDate: filters.start_date,
        },
      );
    }

    if (filters.end_date) {
      qb.andWhere(
        'DATE(capture.created_at) <= :endDate',
        {
          endDate: filters.end_date,
        },
      );
    }

    if (filters.is_alert === 'true') {
      qb.andWhere(
        'capture.is_alert = :isAlert',
        {
          isAlert: true,
        },
      );
    }

    if (filters.is_reviewed === 'true') {
      qb.andWhere(
        'capture.is_reviewed = :isReviewed',
        {
          isReviewed: true,
        },
      );
    }

    qb.orderBy('capture.created_at', 'DESC');

    qb.skip((page - 1) * limit);

    qb.take(limit);

    const [items, total] =
      await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
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

    // Delete file dari Cloudinary jika ada
    if (capture.image_url) {
      await this.deleteFromCloudinary(capture.image_url);
    }
    
    await this.cameraCaptureRepository.remove(capture);
  }

  private async deleteFromCloudinary(fileUrl: string): Promise<void> {
    try {
      const publicId = fileUrl.split('/').pop()?.split('.')[0];
      
      if (!publicId) return;

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      
      // Detect resource type (image atau video)
      const resourceType = fileUrl.includes('video') ? 'video' : 'image';
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload`;
      
      await axios.delete(`${url}/${publicId}`, {
        auth: {
          username: apiKey,
          password: apiSecret,
        },
      });
    } catch (err) {
      console.error('Error deleting from Cloudinary:', err);
      // Lanjutkan delete dari DB meski Cloudinary gagal
    }
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

  private async sendTelegramNotification(capture: CameraCapture) {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      const message = `🚨 Aktivitas Terdeteksi

  Waktu: ${new Date().toLocaleString('id-ID')}

  Gambar hasil deteksi telah tersimpan pada sistem Trackify.`;

      await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
        },
      );
    } catch (error) {
      console.error('Telegram Error:', error);
    }
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
