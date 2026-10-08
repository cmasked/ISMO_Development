import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '../../../shared/enums/task-priority.enum';
import { TaskStatus } from '../../../shared/enums/task-status.enum';
import { Task } from '../entities/task.entity';

export class TaskResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty({ format: 'uuid' })
  projectId!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;
  @ApiProperty({ enum: TaskPriority })
  priority!: TaskPriority;
  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;
  @ApiProperty({ type: String, format: 'date', nullable: true })
  dueDate!: string | null;
  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(task: Task): TaskResponseDto {
    const {
      id,
      projectId,
      name,
      description,
      priority,
      status,
      dueDate,
      createdAt,
      updatedAt,
    } = task;
    return {
      id,
      projectId,
      name,
      description,
      priority,
      status,
      dueDate,
      createdAt,
      updatedAt,
    };
  }
}
