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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtGuard } from '@/guards/jwt.guard';
import { CreateLocationDto, UpdateLocationDto } from '@/dtos/location.dto';

@Controller('locations')
@UseGuards(JwtGuard)
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ) {
    return this.locationsService.findAll(skip, take);
  }

  @Get('stats')
  async getStats() {
    return this.locationsService.getStats();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.locationsService.findById(id);
  }

  @Get(':id/items')
  async getLocationItems(@Param('id') id: string) {
    return this.locationsService.getLocationItems(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.locationsService.delete(id);
  }
}
