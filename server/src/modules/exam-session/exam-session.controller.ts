import { Controller, Get, Post, Body, HttpCode, Query } from '@nestjs/common';
import { ExamSessionService } from './exam-session.service';

@Controller('sessions')
export class ExamSessionController {
  constructor(private readonly sessionService: ExamSessionService) {}

  @Post('start')
  @HttpCode(200)
  async startSession(@Body() body: {
    userId?: number;
    mode: string;
    subjectId?: string;
    subjectName?: string;
    totalQuestions?: number;
  }) {
    const session = await this.sessionService.createSession(body);
    return { code: 200, msg: 'success', data: session };
  }

  @Post(':id/update')
  @HttpCode(200)
  async updateSession(
    @Body() body: {
      incrementCorrect?: boolean;
      incrementTotal?: boolean;
      addDuration?: number;
    },
    @Query('id') id: string,
  ) {
    await this.sessionService.updateSession(id, body);
    return { code: 200, msg: 'success' };
  }

  @Post(':id/complete')
  @HttpCode(200)
  async completeSession(@Query('id') id: string) {
    await this.sessionService.completeSession(id);
    return { code: 200, msg: 'success' };
  }

  @Get('recent')
  @HttpCode(200)
  async getRecentSessions(@Query('userId') userId?: number, @Query('limit') limit?: string) {
    const sessions = await this.sessionService.getRecentSessions(userId, limit ? parseInt(limit) : 10);
    return { code: 200, msg: 'success', data: sessions };
  }

  @Get(':id')
  @HttpCode(200)
  async getSession(@Query('id') id: string) {
    const session = await this.sessionService.getSessionById(id);
    return { code: 200, msg: 'success', data: session };
  }
}
