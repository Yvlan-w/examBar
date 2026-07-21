import { Controller, Get, HttpCode } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @HttpCode(200)
  getOverview() {
    return { code: 200, msg: 'success', data: this.statsService.getOverview() };
  }

  @Get('detail')
  @HttpCode(200)
  getDetail() {
    return { code: 200, msg: 'success', data: this.statsService.getDetail() };
  }
}
