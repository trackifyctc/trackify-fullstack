import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ForeignKey,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Location } from './location.entity';
import { ActivityLog } from './activity-log.entity';
import { ScanHistory } from './scan-history.entity';

export enum InventoryStatus {
  TERSEDIA = 'TERSEDIA',
  DIPERBARUI = 'DIPERBARUI',
  BERPINDAH = 'BERPINDAH',
  HILANG = 'HILANG',
}

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  qr_code: string;

  @Column({ nullable: true })
  category: string;

  @Column()
  location_id: string;

  @ManyToOne(() => Location, (location) => location.items, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.TERSEDIA,
  })
  status: InventoryStatus;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  min_quantity: number;

  @Column({ default: 100 })
  max_quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  last_scanned_at: Date;

  @Column({ nullable: true })
  last_scanned_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ActivityLog, (activity) => activity.inventory_item)
  activities: ActivityLog[];

  @OneToMany(() => ScanHistory, (scan) => scan.inventory_item)
  scans: ScanHistory[];
}
