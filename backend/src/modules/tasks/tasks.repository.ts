import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { nameSearchPattern } from '../../shared/utils/filter.util';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
  ) {}

  private ownedQuery(userId: string): SelectQueryBuilder<Task> {
    return this.tasks
      .createQueryBuilder('task')
      .innerJoin('task.project', 'project')
      .where('project.ownerId = :userId', { userId });
  }

  findAll(userId: string, filters: TaskQueryDto): Promise<Task[]> {
    const query = this.ownedQuery(userId);
    if (filters.search)
      query.andWhere('task.name ILIKE :search', {
        search: nameSearchPattern(filters.search),
      });
    if (filters.status)
      query.andWhere('task.status = :status', { status: filters.status });
    if (filters.priority)
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    if (filters.projectId)
      query.andWhere('task.projectId = :projectId', {
        projectId: filters.projectId,
      });
    return query
      .orderBy('task.createdAt', 'DESC')
      .addOrderBy('task.id', 'DESC')
      .getMany();
  }

  findById(id: string, userId: string): Promise<Task | null> {
    return this.ownedQuery(userId).andWhere('task.id = :id', { id }).getOne();
  }

  createAndSave(data: DeepPartial<Task>): Promise<Task> {
    return this.tasks.save(this.tasks.create(data));
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTaskDto,
  ): Promise<number> {
    const result = await this.tasks
      .createQueryBuilder()
      .update(Task)
      .set(dto)
      .where('id = :id', { id })
      .andWhere(
        'project_id IN (SELECT id FROM projects WHERE owner_id = :userId)',
        { userId },
      )
      .execute();
    return result.affected ?? 0;
  }

  async delete(id: string, userId: string): Promise<number> {
    const result = await this.tasks
      .createQueryBuilder()
      .delete()
      .from(Task)
      .where('id = :id', { id })
      .andWhere(
        'project_id IN (SELECT id FROM projects WHERE owner_id = :userId)',
        { userId },
      )
      .execute();
    return result.affected ?? 0;
  }
}
