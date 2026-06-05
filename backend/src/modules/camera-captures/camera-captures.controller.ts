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
import { CameraCapturesService } from './camera-captures.service';
import { JwtGuard } from '@/guards/jwt.guard';
import { DevicesService } from '../devices/devices.service';

@Controller('camera-captures')
export class CameraCapturesController {
  constructor(
    private cameraCapturesService: CameraCapturesService,
    private devicesService: DevicesService,
  ) {}

  // Admin endpoints - protected with JWT
  @Get()
  @UseGuards(JwtGuard)
  async findAll(
    @Query() query: any,
  ) {
    return this.cameraCapturesService.findAll(query);
  }

  @Get('alerts')
  @UseGuards(JwtGuard)
  async findAlerts(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.cameraCapturesService.findAlerts(skip, take);
  }

  @Get('stats')
  @UseGuards(JwtGuard)
  async getStats() {
    return this.cameraCapturesService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async findById(@Param('id') id: string) {
    return this.cameraCapturesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createData: Partial<any>) {
    return this.cameraCapturesService.create(createData);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<any>,
  ) {
    return this.cameraCapturesService.update(id, updateData);
  }

  @Patch(':id/reviewed')
  @UseGuards(JwtGuard)
  async markReviewed(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.cameraCapturesService.markReviewed(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.cameraCapturesService.delete(id);
  }

  // Hardware endpoint - protected with API key
  @Post('from-device')
  @HttpCode(HttpStatus.CREATED)
  async createFromDevice(
    @Headers('X-API-Key') apiKey: string,
    @Body() createData: Partial<any>,
  ) {
    if (!apiKey) {
      throw new BadRequestException('API key required');
    }
    const device = await this.devicesService.findByApiKey(apiKey);
    createData.device_id = device.id;
    return this.cameraCapturesService.create(createData);
  }
}
