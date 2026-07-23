import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { StorageService } from '../storage/storage.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any) {
    console.log('Received avatar upload:', file.originalname);
    try {
      const fileBuffer = file.buffer;
      const fileName = `avatar_${Date.now()}_${file.originalname}`;
      const contentType = file.mimetype || 'image/png';
      
      const url = await this.storageService.uploadFile(fileBuffer, fileName, contentType);
      console.log('Avatar uploaded to storage:', url);
      
      return { success: true, data: { url } };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { success: false, message: '头像上传失败' };
    }
  }

  @Post('login')
  async login(@Body() body: { code: string; nickName?: string; avatarUrl?: string }) {
    console.log('Received login request:', body);
    const result = await this.authService.login(body.code, body.nickName, body.avatarUrl);
    console.log('Login result:', result);
    return result;
  }

  @Post('login-h5')
  async loginH5(@Body() body: { openid: string; nickName?: string; avatarUrl?: string }) {
    console.log('Received H5 login request:', body);
    const result = await this.authService.loginH5(body.openid, body.nickName, body.avatarUrl);
    console.log('H5 login result:', result);
    return result;
  }
}