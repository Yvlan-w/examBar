import { Module } from '@nestjs/common';
import { AnswerEvaluateService } from './answer-evaluate.service';

@Module({
  providers: [AnswerEvaluateService],
  exports: [AnswerEvaluateService],
})
export class AnswerEvaluateModule {}