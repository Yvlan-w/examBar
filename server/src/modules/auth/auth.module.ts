import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DbModule } from '@/db/db.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DbModule, StorageModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}