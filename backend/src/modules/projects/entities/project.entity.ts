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
import { ProjectStatus } from '../../../shared/enums/project-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'projects' })
@Index('idx_projects_owner_status', ['ownerId', 'status'])
@Index('idx_projects_owner_created', ['ownerId', 'createdAt'])
@Check('ck_projects_name', 'length(trim(name)) > 0')
@Check(
  'ck_projects_description',
  'description IS NULL OR length(description) <= 10000',
)
@Check(
  'ck_projects_dates',
  'start_date IS NULL OR end_date IS NULL OR end_date >= start_date',
)
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'owner_id',
    foreignKeyConstraintName: 'projects_owner_id_fkey',
  })
  owner!: User;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    enumName: 'project_status_enum',
    default: ProjectStatus.NOT_STARTED,
  })
  status!: ProjectStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
