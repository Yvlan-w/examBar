import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { DbModule } from '@/db/db.module';
import { StatsModule } from '../stats/stats.module';
import { AnswerEvaluateModule } from '../answer-evaluate/answer-evaluate.module';

@Module({
  imports: [DbModule, StatsModule, AnswerEvaluateModule],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
