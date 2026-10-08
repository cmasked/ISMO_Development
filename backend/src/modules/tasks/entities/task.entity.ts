import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskPriority } from '../../../shared/enums/task-priority.enum';
import { TaskStatus } from '../../../shared/enums/task-status.enum';
import { Project } from '../../projects/entities/project.entity';

@Entity({ name: 'tasks' })
@Index('idx_tasks_project_status_priority', ['projectId', 'status', 'priority'])
@Check('ck_tasks_name', 'length(trim(name)) > 0')
@Check(
  'ck_tasks_description',
  'description IS NULL OR length(description) <= 10000',
)
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'project_id',
    foreignKeyConstraintName: 'tasks_project_id_fkey',
  })
  project!: Project;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    enumName: 'task_priority_enum',
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status_enum',
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
