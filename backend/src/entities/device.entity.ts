import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DeviceAlert } from './device-alert.entity';
import { CameraCapture } from './camera-capture.entity';
import { Location } from './location.entity';

export enum DeviceType {
  SCANNER = 'scanner',
  SENSOR = 'sensor',
  CAMERA = 'camera',
  GATEWAY = 'gateway',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
  })
  device_type: DeviceType;

  @Column({ unique: true })
  serial_number: string;

  @Column({ unique: true })
  api_key: string;

  @Column({ nullable: true })
  location_id: string;

  @ManyToOne(() => Location, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFFLINE,
  })
  status: DeviceStatus;

  @Column({ nullable: true })
  last_heartbeat: Date;

  @Column({ nullable: true })
  firmware_version: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  mac_address: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => DeviceAlert, (alert) => alert.device)
  alerts: DeviceAlert[];

  @OneToMany(() => CameraCapture, (capture) => capture.device)
  captures: CameraCapture[];
}
