import { Injectable, Logger } from '@nestjs/common';
import { handleServiceError } from '../../shared/utils/service-error.util';
import { DashboardRepository } from './dashboard.repository';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStatistics(userId: string): Promise<DashboardResponseDto> {
    try {
      return await this.dashboardRepository.getStatistics(userId);
    } catch (error) {
      handleServiceError(error, this.logger, 'getStatistics');
    }
  }
}
