import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { MessageResponseDto } from '../../shared/dto/message-response.dto';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { ApiSuccessResponse } from '../../swagger/api-success-response.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'List owned projects with optional name search and status filter',
  })
  @ApiSuccessResponse(ProjectResponseDto, 200, true)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProjectQueryDto,
  ): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiSuccessResponse(ProjectResponseDto)
  findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findById(id, user.userId);
  }

  @Post()
  @ApiSuccessResponse(ProjectResponseDto, 201)
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(dto, user.userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update supplied project fields; omitted fields remain unchanged',
  })
  @ApiSuccessResponse(ProjectResponseDto)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiSuccessResponse(MessageResponseDto)
  delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    return this.projectsService.delete(id, user.userId);
  }
}
