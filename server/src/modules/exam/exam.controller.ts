import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ExamService } from './exam.service';

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('start')
  @HttpCode(200)
  async startExam(@Body() body: { subjectId: string; duration: number; questionCount?: number }) {
    const result = await this.examService.startExam(body.subjectId, body.duration, body.questionCount || 20);
    return { code: 200, msg: 'success', data: result };
  }

  @Post('submit')
  @HttpCode(200)
  async submitExam(
    @Body() body: {
      subjectId: string;
      answers: { questionId: string; answer: string }[];
      timeUsed: number;
      userId?: number;
    },
  ) {
    const result = await this.examService.submitExam(body.subjectId, body.answers, body.timeUsed, body.userId);
    return { code: 200, msg: 'success', data: result };
  }
}
