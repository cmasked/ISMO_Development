import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, UpdateResult } from 'typeorm';
import { nameSearchPattern } from '../../shared/utils/filter.util';
import { Project } from './entities/project.entity';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
  ) {}

  findAll(ownerId: string, filters: ProjectQueryDto): Promise<Project[]> {
    const query = this.projects
      .createQueryBuilder('project')
      .where('project.ownerId = :ownerId', { ownerId });
    if (filters.search)
      query.andWhere('project.name ILIKE :search', {
        search: nameSearchPattern(filters.search),
      });
    if (filters.status)
      query.andWhere('project.status = :status', { status: filters.status });
    return query
      .orderBy('project.createdAt', 'DESC')
      .addOrderBy('project.id', 'DESC')
      .getMany();
  }

  findById(id: string, ownerId: string): Promise<Project | null> {
    return this.projects.findOneBy({ id, ownerId });
  }

  createAndSave(data: DeepPartial<Project>): Promise<Project> {
    return this.projects.save(this.projects.create(data));
  }

  update(
    id: string,
    ownerId: string,
    dto: UpdateProjectDto,
  ): Promise<UpdateResult> {
    return this.projects.update({ id, ownerId }, dto);
  }

  async delete(id: string, ownerId: string): Promise<number> {
    return (await this.projects.delete({ id, ownerId })).affected ?? 0;
  }
}
