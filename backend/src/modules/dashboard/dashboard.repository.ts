import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectStatus } from '../../shared/enums/project-status.enum';
import { TaskStatus } from '../../shared/enums/task-status.enum';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardRepository {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
  ) {}

  async getStatistics(userId: string): Promise<DashboardResponseDto> {
    const [projectStats, taskStats] = await Promise.all([
      this.projects
        .createQueryBuilder('project')
        .select('COUNT(*)', 'totalProjects')
        .addSelect(
          'COUNT(*) FILTER (WHERE project.status = :status)',
          'projectsInProgress',
        )
        .where('project.ownerId = :userId', {
          userId,
          status: ProjectStatus.IN_PROGRESS,
        })
        .getRawOne<{ totalProjects: string; projectsInProgress: string }>(),
      this.tasks
        .createQueryBuilder('task')
        .innerJoin('task.project', 'project')
        .select('COUNT(*)', 'totalTasks')
        .addSelect(
          'COUNT(*) FILTER (WHERE task.status = :completed)',
          'completedTasks',
        )
        .addSelect(
          'COUNT(*) FILTER (WHERE task.status = :pending)',
          'pendingTasks',
        )
        .where('project.ownerId = :userId', {
          userId,
          completed: TaskStatus.COMPLETED,
          pending: TaskStatus.PENDING,
        })
        .getRawOne<{
          totalTasks: string;
          completedTasks: string;
          pendingTasks: string;
        }>(),
    ]);
    return {
      totalProjects: Number(projectStats?.totalProjects ?? 0),
      projectsInProgress: Number(projectStats?.projectsInProgress ?? 0),
      totalTasks: Number(taskStats?.totalTasks ?? 0),
      completedTasks: Number(taskStats?.completedTasks ?? 0),
      pendingTasks: Number(taskStats?.pendingTasks ?? 0),
    };
  }
}
