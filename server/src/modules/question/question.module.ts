import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { DbModule } from '@/db/db.module';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [DbModule, StatsModule],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
