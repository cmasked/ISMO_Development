import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ minimum: 0 })
  totalProjects!: number;
  @ApiProperty({ minimum: 0 })
  totalTasks!: number;
  @ApiProperty({ minimum: 0 })
  completedTasks!: number;
  @ApiProperty({
    minimum: 0,
    description: 'Tasks whose status is PENDING; excludes IN_PROGRESS',
  })
  pendingTasks!: number;
  @ApiProperty({ minimum: 0 })
  projectsInProgress!: number;
}
