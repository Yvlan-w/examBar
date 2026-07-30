import { Controller, Get, Post, Body, HttpCode, Param, Query } from '@nestjs/common';
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
    questionIds?: string[];
  }) {
    const session = await this.sessionService.createSession(body);
    return { code: 200, msg: 'success', data: session };
  }

  @Post(':id/update')
  @HttpCode(200)
  async updateSession(
    @Param('id') id: string,
    @Body() body: {
      incrementCorrect?: boolean;
      addDuration?: number;
      addElapsedTime?: number;
    },
  ) {
    await this.sessionService.updateSession(id, body);
    return { code: 200, msg: 'success' };
  }

  @Post(':id/complete')
  @HttpCode(200)
  async completeSession(@Param('id') id: string) {
    await this.sessionService.completeSession(id);
    return { code: 200, msg: 'success' };
  }

  @Post(':id/mark-answered')
  @HttpCode(200)
  async markQuestionAnswered(
    @Param('id') id: string,
    @Body() body: { questionId: string },
  ) {
    await this.sessionService.markQuestionAnswered(id, body.questionId);
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
  async getSession(@Param('id') id: string) {
    const session = await this.sessionService.getSessionById(id);
    return { code: 200, msg: 'success', data: session };
  }

  @Get(':id/detail')
  @HttpCode(200)
  async getSessionDetail(@Param('id') id: string) {
    const detail = await this.sessionService.getSessionDetail(id);
    if (!detail) {
      return { code: 404, msg: '场次不存在', data: null };
    }
    return { code: 200, msg: 'success', data: detail };
  }

  @Get(':id/questions')
  @HttpCode(200)
  async getSessionQuestions(@Param('id') id: string) {
    const result = await this.sessionService.getSessionQuestions(id);
    if (!result) {
      return { code: 404, msg: '场次不存在', data: null };
    }
    return { code: 200, msg: 'success', data: result };
  }

  @Get(':id/remaining')
  @HttpCode(200)
  async getRemainingQuestions(@Param('id') id: string) {
    const result = await this.sessionService.getRemainingQuestions(id);
    if (!result) {
      return { code: 404, msg: '场次不存在', data: null };
    }
    return { code: 200, msg: 'success', data: result };
  }
}
