import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../../shared/decorators/trim.decorator';
import { ProjectStatus } from '../../../shared/enums/project-status.enum';

export class ProjectQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive literal name search',
    maxLength: 150,
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
