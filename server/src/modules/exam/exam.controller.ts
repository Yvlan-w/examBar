import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ExamService } from './exam.service';

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('start')
  @HttpCode(200)
  startExam(@Body() body: { subjectId: string; duration: number }) {
    const result = this.examService.startExam(body.subjectId, body.duration);
    return { code: 200, msg: 'success', data: result };
  }

  @Post('submit')
  @HttpCode(200)
  submitExam(
    @Body() body: {
      subjectId: string;
      answers: { questionId: string; answer: string }[];
      timeUsed: number;
    },
  ) {
    const result = this.examService.submitExam(body.subjectId, body.answers, body.timeUsed);
    return { code: 200, msg: 'success', data: result };
  }
}
