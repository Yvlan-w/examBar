import { Module } from '@nestjs/common';
import { CustomSubjectController } from './custom-subject.controller';
import { CustomSubjectService } from './custom-subject.service';

@Module({
  controllers: [CustomSubjectController],
  providers: [CustomSubjectService],
})
export class CustomSubjectModule {}