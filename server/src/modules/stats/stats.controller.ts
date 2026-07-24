import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @HttpCode(200)
  async getOverview(@Query('userId') userId?: number) {
    const data = await this.statsService.getOverview(userId);
    return { code: 200, msg: 'success', data };
  }

  @Get('detail')
  @HttpCode(200)
  getDetail() {
    return { code: 200, msg: 'success', data: this.statsService.getDetail() };
  }

  @Get('wrong-questions')
  @HttpCode(200)
  getWrongQuestions(@Query('subjectId') subjectId?: string) {
    return { code: 200, msg: 'success', data: this.statsService.getWrongQuestions(subjectId) };
  }
}
