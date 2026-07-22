import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { code: string }) {
    console.log('Received login request with code:', body.code);
    const result = await this.authService.login(body.code);
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