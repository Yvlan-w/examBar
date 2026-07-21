import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { QuestionModule } from '@/modules/question/question.module';
import { ExamModule } from '@/modules/exam/exam.module';
import { StatsModule } from '@/modules/stats/stats.module';

@Module({
  imports: [QuestionModule, ExamModule, StatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
