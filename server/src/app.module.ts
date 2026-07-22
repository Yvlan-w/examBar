import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { QuestionModule } from '@/modules/question/question.module';
import { ExamModule } from '@/modules/exam/exam.module';
import { StatsModule } from '@/modules/stats/stats.module';
import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DbModule } from '@/db/db.module';

dotenv.config();

@Module({
  imports: [DbModule, QuestionModule, ExamModule, StatsModule, UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}