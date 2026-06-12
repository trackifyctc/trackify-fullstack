import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { User } from './user.entity';

export enum ServoDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  RESET = 'reset',
}

@Entity('servo_commands')
export class ServoCommand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  device_id: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({
    type: 'enum',
    enum: ServoDirection,
  })
  direction: ServoDirection;

  @Column({ default: 30 }) // Default angle (degrees)
  angle: number;

  @Column({ type: 'text', nullable: true })
  command_data: string; // JSON string untuk data tambahan

  @Column({ default: false })
  is_executed: boolean;

  @Column({ nullable: true })
  executed_at: Date;

  @Column({ nullable: true })
  executed_by: string; // User ID yang menjalankan command

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'executed_by' })
  executor: User;

  @Column({ nullable: true })
  response_data: string; // JSON response dari Raspberry Pi

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  status: 'pending' | 'processing' | 'success' | 'failed';

  @Column({ nullable: true })
  error_message: string;
}