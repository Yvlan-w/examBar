import { Module } from '@nestjs/common';
import { WrongQuestionsService } from './wrong-questions.service';

@Module({
  providers: [WrongQuestionsService],
  exports: [WrongQuestionsService],
})
export class WrongQuestionsModule {}
