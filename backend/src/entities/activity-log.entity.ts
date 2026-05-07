import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Inventory } from './inventory.entity';
import { User } from './user.entity';
import { Location } from './location.entity';

export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SCAN = 'SCAN',
  ALERT = 'ALERT',
  MOVE = 'MOVE',
  CHECK = 'CHECK',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inventory_item_id: string;

  @ManyToOne(() => Inventory, (inventory) => inventory.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item: Inventory;

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

  @Column()
  action: string;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  action_type: ActionType;

  @Column({ default: false })
  has_barcode_scan: boolean;

  @Column({ default: false })
  is_alert: boolean;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @CreateDateColumn()
  created_at: Date;
}
