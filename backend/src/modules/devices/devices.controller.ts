import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,

} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtGuard } from '@/guards/jwt.guard';

@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('hardware/heartbeat')
  async heartbeat(
    @Headers('X-API-Key') apiKey: string,
    @Body() data: any,
  ) {
    if (!apiKey) {
      throw new BadRequestException(
        'API key required',
      );
    }

    const device =
      await this.devicesService.findByApiKey(
        apiKey,
      );

    return this.devicesService.updateHeartbeat(
      device.id,
      data,
    );
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(
    @Query('status') status?: string,
    @Query('device_type') device_type?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.devicesService.findAll(skip, take);
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  async getStats() {
    return this.devicesService.getStats();
  }

  @Get('alerts/all')
  @UseGuards(JwtGuard)
  async getAlerts(
    @Query('device_id') device_id?: string,
    @Query('alert_type') alert_type?: string,
  ) {
    return this.devicesService.getAlerts(device_id);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async findById(@Param('id') id: string) {
    return this.devicesService.findById(id);
  }

  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) {
    return this.devicesService.registerDevice(data);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.devicesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.devicesService.delete(id);
  }

  @Post(':id/regenerate-key')
  @UseGuards(JwtGuard)
  async regenerateKey(@Param('id') id: string) {
    return this.devicesService.regenerateApiKey(id);
  }

  @Post('alerts/:alertId/acknowledge')
  @UseGuards(JwtGuard)
  async acknowledgeAlert(@Param('alertId') alertId: string, @Query('user_id') userId: string) {
    return this.devicesService.acknowledgeAlert(alertId, userId);
  }

  @Post('alerts/:alertId/resolve')
  @UseGuards(JwtGuard)
  async resolveAlert(@Param('alertId') alertId: string) {
    return this.devicesService.resolveAlert(alertId);
  }
}
      
