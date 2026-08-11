import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { StatsModule } from '../stats/stats.module';
import { ExamSessionModule } from '../exam-session/exam-session.module';
import { WrongQuestionsModule } from '../wrong-questions/wrong-questions.module';

@Module({
  imports: [StatsModule, ExamSessionModule, WrongQuestionsModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
