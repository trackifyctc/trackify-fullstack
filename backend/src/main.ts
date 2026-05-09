import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const logger = new Logger('Bootstrap');

  // Global Prefix
  const globalPrefix = configService.get<string>('API_PREFIX', 'api');

  app.setGlobalPrefix(globalPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Railway Port
  const port = process.env.PORT || configService.get<number>('PORT', 3001);

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);

  process.exit(1);
});