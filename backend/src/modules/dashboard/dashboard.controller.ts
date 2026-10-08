import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { ApiSuccessResponse } from '../../swagger/api-success-response.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiSuccessResponse(DashboardResponseDto)
  getStatistics(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DashboardResponseDto> {
    return this.dashboardService.getStatistics(user.userId);
  }
}
