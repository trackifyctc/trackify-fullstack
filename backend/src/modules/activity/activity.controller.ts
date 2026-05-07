import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtGuard } from '@/guards/jwt.guard';

@Controller('activity')
@UseGuards(JwtGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get('logs')
  async getActivityLogs(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.activityService.getActivityLogs(skip, take);
  }

  @Get('recent')
  async getRecentActivities(@Query('limit') limit: number = 50) {
    return this.activityService.getRecentActivities(limit);
  }

  @Get('alerts')
  async getAlertActivities(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.activityService.getAlertActivities(skip, take);
  }

  @Get('scans')
  async getScanHistory(
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.activityService.getScanHistory(inventoryItemId, skip, take);
  }

  @Get('stats')
  async getStats() {
    return this.activityService.getStats();
  }
}
