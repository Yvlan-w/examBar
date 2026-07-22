import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { code: string }) {
    const result = await this.authService.login(body.code);
    return { success: true, data: result };
  }

  @Post('login-h5')
  async loginH5(@Body() body: { openid: string; nickName?: string; avatarUrl?: string }) {
    const result = await this.authService.loginH5(body.openid, body.nickName, body.avatarUrl);
    return { success: true, data: result };
  }
}