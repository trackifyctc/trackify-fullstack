import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ForeignKey,
  JoinColumn,
} from 'typeorm';
import { Device } from './device.entity';

export enum AlertType {
  MOTION = 'MOTION',
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  UNAUTHORIZED = 'UNAUTHORIZED',
  LOW_STOCK = 'LOW_STOCK',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  CUSTOM = 'CUSTOM',
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('device_alerts')
export class DeviceAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  device_id: string;

  @ManyToOne(() => Device, (device) => device.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  alert_type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
  })
  severity: AlertSeverity;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ default: false })
  is_acknowledged: boolean;

  @Column({ nullable: true })
  acknowledged_by: string;

  @Column({ nullable: true })
  acknowledged_at: Date;

  @Column({ default: false })
  is_resolved: boolean;

  @Column({ nullable: true })
  resolved_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
