import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'Trackify API is running',
      version: '2.0.0',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      message: 'Trackify API is running',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
