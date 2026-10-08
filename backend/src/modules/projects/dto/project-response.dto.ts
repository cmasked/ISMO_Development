import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '../../../shared/enums/project-status.enum';
import { Project } from '../entities/project.entity';

export class ProjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty({ format: 'uuid', readOnly: true })
  ownerId!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;
  @ApiProperty({ enum: ProjectStatus })
  status!: ProjectStatus;
  @ApiProperty({ type: String, format: 'date', nullable: true })
  startDate!: string | null;
  @ApiProperty({ type: String, format: 'date', nullable: true })
  endDate!: string | null;
  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(project: Project): ProjectResponseDto {
    const {
      id,
      ownerId,
      name,
      description,
      status,
      startDate,
      endDate,
      createdAt,
      updatedAt,
    } = project;
    return {
      id,
      ownerId,
      name,
      description,
      status,
      startDate,
      endDate,
      createdAt,
      updatedAt,
    };
  }
}
