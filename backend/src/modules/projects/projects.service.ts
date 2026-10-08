import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageResponseDto } from '../../shared/dto/message-response.dto';
import { ProjectStatus } from '../../shared/enums/project-status.enum';
import { handleServiceError } from '../../shared/utils/service-error.util';
import { requireUpdateFields } from '../../shared/utils/update.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async findAll(
    userId: string,
    filters: ProjectQueryDto,
  ): Promise<ProjectResponseDto[]> {
    try {
      return (await this.projectsRepository.findAll(userId, filters)).map(
        ProjectResponseDto.fromEntity,
      );
    } catch (error) {
      handleServiceError(error, this.logger, 'findAll');
    }
  }

  async findById(id: string, userId: string): Promise<ProjectResponseDto> {
    try {
      const project = await this.projectsRepository.findById(id, userId);
      if (!project) throw new NotFoundException('Project not found');
      return ProjectResponseDto.fromEntity(project);
    } catch (error) {
      handleServiceError(error, this.logger, 'findById');
    }
  }

  async create(
    dto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    try {
      this.validateDateRange(dto.startDate, dto.endDate);
      const project = await this.projectsRepository.createAndSave({
        ownerId: userId,
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? ProjectStatus.NOT_STARTED,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
      });
      this.logger.log('Project created');
      return ProjectResponseDto.fromEntity(project);
    } catch (error) {
      handleServiceError(error, this.logger, 'create');
    }
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    try {
      requireUpdateFields(dto);
      const existing = await this.findById(id, userId);
      this.validateDateRange(
        dto.startDate === undefined ? existing.startDate : dto.startDate,
        dto.endDate === undefined ? existing.endDate : dto.endDate,
      );
      const result = await this.projectsRepository.update(id, userId, dto);
      if (!result.affected) throw new NotFoundException('Project not found');
      this.logger.log('Project updated');
      return this.findById(id, userId);
    } catch (error) {
      handleServiceError(error, this.logger, 'update');
    }
  }

  async delete(id: string, userId: string): Promise<MessageResponseDto> {
    try {
      if (!(await this.projectsRepository.delete(id, userId)))
        throw new NotFoundException('Project not found');
      this.logger.log('Project deleted');
      return { message: 'Project and its tasks deleted successfully' };
    } catch (error) {
      handleServiceError(error, this.logger, 'delete');
    }
  }

  private validateDateRange(start?: string | null, end?: string | null): void {
    if (start && end && end < start)
      throw new BadRequestException('endDate must be on or after startDate');
  }
}
