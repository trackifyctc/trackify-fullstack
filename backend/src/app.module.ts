import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

// Controllers
import { AppController } from './app.controller';

// Entities - explicitly import all
import { User } from './entities/user.entity';
import { Inventory } from './entities/inventory.entity';
import { Location } from './entities/location.entity';
import { Device } from './entities/device.entity';
import { DeviceAlert } from './entities/device-alert.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ScanHistory } from './entities/scan-history.entity';
import { Task } from './entities/task.entity';
import { CameraCapture } from './entities/camera-capture.entity';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LocationsModule } from './modules/locations/locations.module';
import { DevicesModule } from './modules/devices/devices.module';
import { ActivityModule } from './modules/activity/activity.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CameraCapturesModule } from './modules/camera-captures/camera-captures.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ServoCommand } from './entities/servo-command.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'trackify'),
        entities: [User, Inventory, Location, Device, DeviceAlert, ActivityLog, ScanHistory, Task, CameraCapture, ServoCommand],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    UsersModule,
    InventoryModule,
    LocationsModule,
    DevicesModule,
    ActivityModule,
    TasksModule,
    CameraCapturesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
