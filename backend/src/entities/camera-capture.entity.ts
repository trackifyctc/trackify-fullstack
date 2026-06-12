import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { Location } from './location.entity';
import { User } from './user.entity';

@Entity('camera_captures')
export class CameraCapture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  device_id: string;

  @ManyToOne(() => Device, (device) => device.captures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ nullable: true })
  location_id: string;

  @ManyToOne(() => Location, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  video_url: string;

  @Column({ type: 'text', nullable: true })
  image_base64: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  location_name: string;

  @Column({ type: 'jsonb', nullable: true })
  detected_objects: any;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'",
  })
  inventory_events: any;

  @Column({ default: 0 })
  detected_count: number;

  @Column({ default: false })
  is_alert: boolean;

  @Column({ nullable: true })
  alert_type: string;

  @Column({ default: false })
  is_reviewed: boolean;

  @Column({ nullable: true })
  reviewed_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ nullable: true })
  reviewed_at: Date;

  @Column()
  captured_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
