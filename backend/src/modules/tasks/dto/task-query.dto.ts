import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { TaskPriority } from '../../../shared/enums/task-priority.enum';
import { TaskStatus } from '../../../shared/enums/task-status.enum';

export class TaskQueryDto {
  @ApiPropertyOptional({
    maxLength: 150,
    description: 'Case-insensitive literal name search',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  projectId?: string;
}
