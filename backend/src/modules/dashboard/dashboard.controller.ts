import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtGuard } from '@/guards/jwt.guard';

@Controller('dashboard')
@UseGuards(JwtGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('stats/all')
  async getAllStats() {
    return this.dashboardService.getAllStats();
  }
}
