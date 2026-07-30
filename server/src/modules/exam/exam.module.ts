import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { StatsModule } from '../stats/stats.module';
import { ExamSessionModule } from '../exam-session/exam-session.module';

@Module({
  imports: [StatsModule, ExamSessionModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
