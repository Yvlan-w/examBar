import { Controller, Get, Post, Param, Query, Body, HttpCode } from '@nestjs/common';
import { QuestionService } from './question.service';

@Controller()
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('subjects')
  @HttpCode(200)
  async getSubjects() {
    const data = await this.questionService.getSubjects();
    return { code: 200, msg: 'success', data };
  }

  @Get('questions')
  @HttpCode(200)
  async getQuestions(@Query('subjectId') subjectId?: string, @Query('type') type?: string) {
    const data = await this.questionService.getQuestions(subjectId, type);
    return { code: 200, msg: 'success', data };
  }

  @Get('questions/daily')
  @HttpCode(200)
  async getDailyQuestion() {
    const data = await this.questionService.getDailyQuestion();
    return { code: 200, msg: 'success', data };
  }

  @Get('questions/:id')
  @HttpCode(200)
  async getQuestionById(@Param('id') id: string) {
    const data = await this.questionService.getQuestionById(id);
    return { code: 200, msg: 'success', data };
  }

  @Post('answers')
  @HttpCode(200)
  async submitAnswer(@Body() body: { questionId: string; answer: string; mode: string; userId?: number }) {
    const result = await this.questionService.submitAnswer(body.questionId, body.answer, body.mode, body.userId);
    if (!result) {
      return { code: 404, msg: '题目不存在', data: null };
    }
    return { code: 200, msg: 'success', data: result };
  }

  @Get('questions/history')
  @HttpCode(200)
  async getHistoryQuestions(@Query('subjectId') subjectId?: string, @Query('year') year?: string) {
    const data = await this.questionService.getHistoryQuestions(subjectId, year);
    return { code: 200, msg: 'success', data };
  }

  @Get('years')
  @HttpCode(200)
  async getYears() {
    const data = await this.questionService.getYears();
    return { code: 200, msg: 'success', data };
  }

  @Post('questions/:id/favorite')
  @HttpCode(200)
  async toggleFavorite(@Param('id') id: string, @Body() body: { userId?: number }) {
    const data = await this.questionService.toggleFavorite(id, body.userId);
    return { code: 200, msg: 'success', data };
  }

  @Get('questions/:id/favorite')
  @HttpCode(200)
  async isFavorite(@Param('id') id: string, @Query('userId') userId?: number) {
    const isFavorite = await this.questionService.isFavorite(id, userId);
    return { code: 200, msg: 'success', data: { isFavorite } };
  }

  @Get('favorites')
  @HttpCode(200)
  async getFavorites(@Query('userId') userId?: number) {
    const data = await this.questionService.getFavoriteQuestions(userId);
    return { code: 200, msg: 'success', data };
  }
}
