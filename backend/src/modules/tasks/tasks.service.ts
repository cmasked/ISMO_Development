import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MessageResponseDto } from '../../shared/dto/message-response.dto';
import { TaskPriority } from '../../shared/enums/task-priority.enum';
import { TaskStatus } from '../../shared/enums/task-status.enum';
import { handleServiceError } from '../../shared/utils/service-error.util';
import { requireUpdateFields } from '../../shared/utils/update.util';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly projectsService: ProjectsService,
  ) {}

  async findAll(
    userId: string,
    filters: TaskQueryDto,
  ): Promise<TaskResponseDto[]> {
    try {
      return (await this.tasksRepository.findAll(userId, filters)).map(
        TaskResponseDto.fromEntity,
      );
    } catch (error) {
      handleServiceError(error, this.logger, 'findAll');
    }
  }

  async findById(id: string, userId: string): Promise<TaskResponseDto> {
    try {
      const task = await this.tasksRepository.findById(id, userId);
      if (!task) throw new NotFoundException('Task not found');
      return TaskResponseDto.fromEntity(task);
    } catch (error) {
      handleServiceError(error, this.logger, 'findById');
    }
  }

  async create(dto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    try {
      await this.projectsService.findById(dto.projectId, userId);
      const task = await this.tasksRepository.createAndSave({
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description ?? null,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        status: dto.status ?? TaskStatus.PENDING,
        dueDate: dto.dueDate ?? null,
      });
      this.logger.log('Task created');
      return TaskResponseDto.fromEntity(task);
    } catch (error) {
      handleServiceError(error, this.logger, 'create');
    }
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    try {
      requireUpdateFields(dto);
      await this.findById(id, userId);
      if (dto.projectId)
        await this.projectsService.findById(dto.projectId, userId);
      if (!(await this.tasksRepository.update(id, userId, dto)))
        throw new NotFoundException('Task not found');
      this.logger.log('Task updated');
      return this.findById(id, userId);
    } catch (error) {
      handleServiceError(error, this.logger, 'update');
    }
  }

  async delete(id: string, userId: string): Promise<MessageResponseDto> {
    try {
      if (!(await this.tasksRepository.delete(id, userId)))
        throw new NotFoundException('Task not found');
      this.logger.log('Task deleted');
      return { message: 'Task deleted successfully' };
    } catch (error) {
      handleServiceError(error, this.logger, 'delete');
    }
  }
}
