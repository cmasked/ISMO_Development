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
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({
    summary:
      'List owned tasks; combine project, name, status and priority filters',
  })
  @ApiSuccessResponse(TaskResponseDto, 200, true)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TaskQueryDto,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiSuccessResponse(TaskResponseDto)
  findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findById(id, user.userId);
  }

  @Post()
  @ApiSuccessResponse(TaskResponseDto, 201)
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(dto, user.userId);
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Update supplied fields, including completion, priority and owned project',
  })
  @ApiSuccessResponse(TaskResponseDto)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @ApiSuccessResponse(MessageResponseDto)
  delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    return this.tasksService.delete(id, user.userId);
  }
}
