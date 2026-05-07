import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '@/entities';
import { CreateTaskDto, UpdateTaskDto } from '@/dtos/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      owner_id: userId,
    });
    return this.taskRepository.save(task);
  }

  async findAll(skip: number = 0, take: number = 10): Promise<any> {
    const [items, total] = await this.taskRepository.findAndCount({
      skip,
      take,
      relations: ['owner'],
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findById(id);
    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async delete(id: string): Promise<void> {
    const task = await this.findById(id);
    await this.taskRepository.remove(task);
  }

  async findByUserId(userId: string, skip: number = 0, take: number = 10): Promise<any> {
    const [items, total] = await this.taskRepository.findAndCount({
      where: { owner_id: userId },
      skip,
      take,
      order: { created_at: 'DESC' },
    });

    return { items, total };
  }
}
