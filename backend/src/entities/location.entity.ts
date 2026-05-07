import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { ActivityLog } from './activity-log.entity';
import { Device } from './device.entity';
import { ScanHistory } from './scan-history.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ default: 0 })
  capacity: number;

  @Column({ default: 0 })
  current_items: number;

  @Column({ type: 'jsonb', nullable: true })
  coordinates: any;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Inventory, (inventory) => inventory.location)
  items: Inventory[];

  @OneToMany(() => ActivityLog, (activityLog) => activityLog.location)
  activities: ActivityLog[];

  @OneToMany(() => Device, (device) => device.location)
  devices: Device[];

  @OneToMany(() => ScanHistory, (scanHistory) => scanHistory.location)
  scans: ScanHistory[];
}
