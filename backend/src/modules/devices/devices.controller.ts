import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtGuard } from '@/guards/jwt.guard';
import { RegisterDeviceDto, UpdateDeviceDto, DeviceHeartbeatDto, DeviceAlertDto } from '@/dtos/device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  // Admin endpoints - protected with JWT
  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(@Body() registerDeviceDto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(registerDeviceDto);
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  async getStats() {
    return this.devicesService.getStats();
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    return this.devicesService.findAll(skip, take);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async findById(@Param('id') id: string) {
    return this.devicesService.findById(id);
  }

  @Get(':id/alerts')
  @UseGuards(JwtGuard)
  async getAlerts(
    @Param('id') id: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    return this.devicesService.getAlerts(id, skip, take);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Patch(':id/regenerate-key')
  @UseGuards(JwtGuard)
  async regenerateApiKey(@Param('id') id: string) {
    return this.devicesService.regenerateApiKey(id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.devicesService.delete(id);
  }

  // Hardware endpoints - protected with API key
  @Post('hardware/heartbeat')
  @HttpCode(HttpStatus.OK)
  async updateHeartbeat(
    @Headers('X-API-Key') apiKey: string,
    @Body() heartbeatDto: DeviceHeartbeatDto,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key required');
    }
    const device = await this.devicesService.findByApiKey(apiKey);
    return this.devicesService.updateHeartbeat(device.id, heartbeatDto);
  }

  @Post('hardware/alert')
  @HttpCode(HttpStatus.CREATED)
  async createAlert(
    @Headers('X-API-Key') apiKey: string,
    @Body() alertDto: DeviceAlertDto,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key required');
    }
    const device = await this.devicesService.findByApiKey(apiKey);
    return this.devicesService.createAlert(device.id, alertDto);
  }

  @Post('hardware/scan')
  @HttpCode(HttpStatus.OK)
  async deviceScan(@Headers('X-API-Key') apiKey: string) {
    if (!apiKey) {
      throw new BadRequestException('API key required');
    }
    const device = await this.devicesService.findByApiKey(apiKey);
    return { status: 'ok', device_id: device.id };
  }

  @Patch('alerts/:alertId/acknowledge')
  @UseGuards(JwtGuard)
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Request() req: any,
  ) {
    return this.devicesService.acknowledgeAlert(alertId, req.user.id);
  }

  @Patch('alerts/:alertId/resolve')
  @UseGuards(JwtGuard)
  async resolveAlert(@Param('alertId') alertId: string) {
    return this.devicesService.resolveAlert(alertId);
  }
}
