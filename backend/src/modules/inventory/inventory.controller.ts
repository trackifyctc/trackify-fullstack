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
import { InventoryService } from './inventory.service';
import { JwtGuard } from '@/guards/jwt.guard';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { CreateInventoryDto, UpdateInventoryDto } from '@/dtos/inventory.dto';

@Controller('inventory')
@UseGuards(JwtGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInventoryDto: CreateInventoryDto, @CurrentUser() user: any) {
    return this.inventoryService.create(createInventoryDto, user?.id);
  }

  @Get()
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.findAll(skip, take, query, category, status);
  }

  @Get('stats')
  async getStats() {
    return this.inventoryService.getStats();
  }

  @Get('categories')
  async getCategories() {
    return this.inventoryService.getCategories();
  }

  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.inventoryService.findByBarcode(barcode);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.update(id, updateInventoryDto, user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inventoryService.delete(id, user?.id);
  }
}
