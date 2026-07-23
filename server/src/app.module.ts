import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { QuestionModule } from '@/modules/question/question.module';
import { ExamModule } from '@/modules/exam/exam.module';
import { StatsModule } from '@/modules/stats/stats.module';
import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { DbModule } from '@/db/db.module';
import { StorageModule } from '@/modules/storage/storage.module';

dotenv.config();

@Module({
  imports: [
    DbModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
    QuestionModule,
    ExamModule,
    StatsModule,
    UserModule,
    AuthModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}