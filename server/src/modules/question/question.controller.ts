import { Controller, Get, Post, Param, Query, Body, HttpCode } from '@nestjs/common';
import { QuestionService } from './question.service';

@Controller()
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('subjects')
  @HttpCode(200)
  getSubjects() {
    return { code: 200, msg: 'success', data: this.questionService.getSubjects() };
  }

  @Get('questions')
  @HttpCode(200)
  getQuestions(@Query('subjectId') subjectId?: string, @Query('type') type?: string) {
    return { code: 200, msg: 'success', data: this.questionService.getQuestions(subjectId, type) };
  }

  @Get('questions/daily')
  @HttpCode(200)
  getDailyQuestion() {
    return { code: 200, msg: 'success', data: this.questionService.getDailyQuestion() };
  }

  @Get('questions/:id')
  @HttpCode(200)
  getQuestionById(@Param('id') id: string) {
    return { code: 200, msg: 'success', data: this.questionService.getQuestionById(id) };
  }

  @Post('answers')
  @HttpCode(200)
  submitAnswer(@Body() body: { questionId: string; answer: string; mode: string }) {
    const result = this.questionService.submitAnswer(body.questionId, body.answer, body.mode);
    if (!result) {
      return { code: 404, msg: '题目不存在', data: null };
    }
    return { code: 200, msg: 'success', data: result };
  }

  @Get('questions/history')
  @HttpCode(200)
  getHistoryQuestions(@Query('subjectId') subjectId?: string, @Query('year') year?: string) {
    return { code: 200, msg: 'success', data: this.questionService.getHistoryQuestions(subjectId, year) };
  }

  @Get('years')
  @HttpCode(200)
  getYears() {
    return { code: 200, msg: 'success', data: this.questionService.getYears() };
  }

  @Post('questions/:id/favorite')
  @HttpCode(200)
  toggleFavorite(@Param('id') id: string) {
    return { code: 200, msg: 'success', data: this.questionService.toggleFavorite(id) };
  }

  @Get('questions/:id/favorite')
  @HttpCode(200)
  isFavorite(@Param('id') id: string) {
    return { code: 200, msg: 'success', data: { isFavorite: this.questionService.isFavorite(id) } };
  }

  @Get('favorites')
  @HttpCode(200)
  getFavorites() {
    return { code: 200, msg: 'success', data: this.questionService.getFavoriteQuestions() };
  }
}
