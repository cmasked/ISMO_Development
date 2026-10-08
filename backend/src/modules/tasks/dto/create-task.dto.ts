import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsCalendarDate } from '../../../shared/decorators/calendar-date.decorator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { TaskPriority } from '../../../shared/enums/task-priority.enum';
import { TaskStatus } from '../../../shared/enums/task-status.enum';

export class CreateTaskDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  projectId!: string;

  @ApiProperty({ maxLength: 150 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 10000 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.PENDING })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsCalendarDate()
  dueDate?: string | null;
}
