import { Controller, Post, Get, Body, Query, Put } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() body: { openid?: string; nickName?: string; avatarUrl?: string }) {
    const user = await this.userService.createUser(body);
    return { success: true, data: user };
  }

  @Get()
  async getUser(@Query('openid') openid?: string, @Query('id') id?: string) {
    let user;
    if (id) {
      user = await this.userService.getUserById(parseInt(id));
    } else if (openid) {
      user = await this.userService.getUserByOpenid(openid);
    }
    return { success: true, data: user };
  }

  @Get('stats')
  async getUserStats(@Query('userId') userId: string) {
    const stats = await this.userService.getUserStats(parseInt(userId));
    return { success: true, data: stats };
  }

  @Get('subject-stats')
  async getSubjectStats(@Query('userId') userId: string) {
    const stats = await this.userService.getSubjectStats(parseInt(userId));
    return { success: true, data: stats };
  }

  @Get('wrong-questions')
  async getWrongQuestions(@Query('userId') userId: string, @Query('subjectId') subjectId?: string) {
    const questions = await this.userService.getWrongQuestions(parseInt(userId), subjectId);
    return { success: true, data: questions };
  }

  @Get('favorites')
  async getFavorites(@Query('userId') userId: string) {
    const questions = await this.userService.getFavoriteQuestions(parseInt(userId));
    return { success: true, data: questions };
  }

  @Put('profile')
  async updateProfile(@Body() body: { id: number; nickName?: string; avatarUrl?: string }) {
    const user = await this.userService.updateProfile(body.id, body.nickName, body.avatarUrl);
    return { success: true, data: user };
  }
}