import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsCalendarDate } from '../../../shared/decorators/calendar-date.decorator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { ProjectStatus } from '../../../shared/enums/project-status.enum';

export class CreateProjectDto {
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

  @ApiPropertyOptional({
    enum: ProjectStatus,
    default: ProjectStatus.NOT_STARTED,
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsCalendarDate()
  startDate?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsCalendarDate()
  endDate?: string | null;
}
