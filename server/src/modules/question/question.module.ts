import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { DbModule } from '@/db/db.module';
import { StatsModule } from '../stats/stats.module';
import { AnswerEvaluateModule } from '../answer-evaluate/answer-evaluate.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DbModule, StatsModule, AnswerEvaluateModule, StorageModule],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
