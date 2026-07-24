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
  async getDetail(@Query('userId') userId?: number) {
    const data = await this.statsService.getDetail(userId);
    return { code: 200, msg: 'success', data };
  }

  @Get('wrong-questions')
  @HttpCode(200)
  async getWrongQuestions(@Query('subjectId') subjectId?: string, @Query('userId') userId?: number) {
    const data = await this.statsService.getWrongQuestions(subjectId, userId);
    return { code: 200, msg: 'success', data };
  }
}
