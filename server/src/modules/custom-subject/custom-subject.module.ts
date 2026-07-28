import { Module } from '@nestjs/common';
import { CustomSubjectController } from './custom-subject.controller';
import { CustomSubjectService } from './custom-subject.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [CustomSubjectController],
  providers: [CustomSubjectService],
})
export class CustomSubjectModule {}