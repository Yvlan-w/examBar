import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ExamService } from './exam.service';

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('start')
  @HttpCode(200)
  async startExam(@Body() body: { subjectId: string; duration: number; questionCount?: number; userId?: number }) {
    console.log(`[API] POST /api/exam/start subjectId=${body.subjectId} userId=${body.userId}`);
    const result = await this.examService.startExam(body.subjectId, body.duration, body.questionCount || 20, body.userId);
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
      sessionId?: string;
    },
  ) {
    console.log(`[API] POST /api/exam/submit subjectId=${body.subjectId} sessionId=${body.sessionId}`);
    const result = await this.examService.submitExam(body.subjectId, body.answers, body.timeUsed, body.userId, body.sessionId);
    return { code: 200, msg: 'success', data: result };
  }
}
