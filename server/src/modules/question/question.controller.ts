import { Controller, Get, Post, Param, Query, Body, HttpCode } from '@nestjs/common';
import { QuestionService } from './question.service';

@Controller()
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('subjects')
  @HttpCode(200)
  async getSubjects() {
    console.log('[API] GET /api/subjects');
    const data = await this.questionService.getSubjects();
    console.log(`[API] subjects 返回 ${data.length} 个科目`);
    return { code: 200, msg: 'success', data };
  }

  @Get('questions')
  @HttpCode(200)
  async getQuestions(@Query('subjectId') subjectId?: string, @Query('type') type?: string, @Query('difficulty') difficulty?: string) {
    console.log(`[API] GET /api/questions subjectId=${subjectId} type=${type} difficulty=${difficulty}`);
    const data = await this.questionService.getQuestions(subjectId, type, difficulty);
    console.log(`[API] questions 返回 ${data.length} 道题目`);
    return { code: 200, msg: 'success', data };
  }

  @Get('questions/daily')
  @HttpCode(200)
  async getDailyQuestion() {
    console.log('[API] GET /api/questions/daily');
    const data = await this.questionService.getDailyQuestion();
    return { code: 200, msg: 'success', data };
  }

  @Get('questions/history')
  @HttpCode(200)
  async getHistoryQuestions(@Query('subjectId') subjectId?: string, @Query('year') year?: string) {
    console.log(`[API] GET /api/questions/history subjectId=${subjectId} year=${year}`);
    const data = await this.questionService.getHistoryQuestions(subjectId, year);
    console.log(`[API] history questions 返回 ${data.length} 道题目`);
    return { code: 200, msg: 'success', data };
  }

  @Get('years')
  @HttpCode(200)
  async getYears() {
    console.log('[API] GET /api/years');
    const data = await this.questionService.getYears();
    console.log(`[API] years 返回 ${data.length} 个年份:`, data);
    return { code: 200, msg: 'success', data };
  }

  @Get('questions/:id')
  @HttpCode(200)
  async getQuestionById(@Param('id') id: string) {
    console.log(`[API] GET /api/questions/${id}`);
    const data = await this.questionService.getQuestionById(id);
    return { code: 200, msg: 'success', data };
  }

  @Post('answers')
  @HttpCode(200)
  async submitAnswer(@Body() body: { questionId: string; answer: string; mode: string; userId?: number; sessionId?: string }) {
    console.log(`[API] POST /api/answers questionId=${body.questionId} sessionId=${body.sessionId}`);
    const result = await this.questionService.submitAnswer(body.questionId, body.answer, body.mode, body.userId, body.sessionId);
    if (!result) {
      return { code: 404, msg: '题目不存在', data: null };
    }
    return { code: 200, msg: 'success', data: result };
  }

  @Post('questions/:id/favorite')
  @HttpCode(200)
  async toggleFavorite(@Param('id') id: string, @Body() body: { userId?: number }) {
    console.log(`[API] POST /api/questions/${id}/favorite`);
    const data = await this.questionService.toggleFavorite(id, body.userId);
    return { code: 200, msg: 'success', data };
  }

  @Get('questions/:id/favorite')
  @HttpCode(200)
  async isFavorite(@Param('id') id: string, @Query('userId') userId?: number) {
    console.log(`[API] GET /api/questions/${id}/favorite`);
    const isFavorite = await this.questionService.isFavorite(id, userId);
    return { code: 200, msg: 'success', data: { isFavorite } };
  }

  @Get('favorites')
  @HttpCode(200)
  async getFavorites(@Query('userId') userId?: number) {
    console.log(`[API] GET /api/favorites userId=${userId}`);
    const data = await this.questionService.getFavoriteQuestions(userId);
    return { code: 200, msg: 'success', data };
  }
}
