import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { Device } from './device.entity';
import { User } from './user.entity';
import { Location } from './location.entity';

export enum ScanType {
  BARCODE = 'BARCODE',
  QR_CODE = 'QR_CODE',
  RFID = 'RFID',
  MANUAL = 'MANUAL',
}

@Entity('scan_history')
export class ScanHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inventory_item_id: string;

  @ManyToOne(() => Inventory, (inventory) => inventory.scans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item: Inventory;

  @Column({ nullable: true })
  device_id: string;

  @ManyToOne(() => Device, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  location_id: string;

  @ManyToOne(() => Location, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({
    type: 'enum',
    enum: ScanType,
  })
  scan_type: ScanType;

  @Column({ nullable: true })
  scanned_data: string;

  @Column({ default: true })
  is_successful: boolean;

  @Column({ nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;
}
