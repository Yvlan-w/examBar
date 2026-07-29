import { Controller, Get, Post, Delete, Body, Query, HttpCode } from '@nestjs/common';
import { CustomSubjectService } from './custom-subject.service';

@Controller('custom-subjects')
export class CustomSubjectController {
  constructor(private readonly customSubjectService: CustomSubjectService) {}

  @Post()
  @HttpCode(200)
  async create(@Body() body: { userId: number; name: string; isPublic: boolean; nickname?: string }) {
    const data = await this.customSubjectService.createCustomSubject(body.userId, body.name, body.isPublic, body.nickname);
    return { code: 200, msg: 'success', data };
  }

  @Post('toggle-visibility')
  @HttpCode(200)
  async toggleVisibility(@Body() body: { userId: number; subjectId: string }) {
    const data = await this.customSubjectService.toggleVisibility(body.userId, body.subjectId);
    return { code: 200, msg: 'success', data };
  }

  @Get()
  @HttpCode(200)
  async getCustomSubjects(@Query('userId') userId?: number) {
    const data = await this.customSubjectService.getCustomSubjects(userId);
    return { code: 200, msg: 'success', data };
  }

  @Get('public')
  @HttpCode(200)
  async getPublicSubjects() {
    const data = await this.customSubjectService.getPublicSubjects();
    return { code: 200, msg: 'success', data };
  }

  @Post('parse')
  @HttpCode(200)
  async parseFile(@Body() body: { fileContent: string; subjectId: string; subjectName: string; nickname?: string }) {
    const data = await this.customSubjectService.parseFileToQuestions(body.fileContent, body.subjectId, body.subjectName, undefined, undefined, body.nickname);
    return { code: 200, msg: 'success', data: data.questions, questionsToUpdate: data.questionsToUpdate };
  }

  @Post('parse-url')
  @HttpCode(200)
  async parseByUrl(@Body() body: { url?: string; urls?: string[]; subjectId: string; subjectName: string; tempFileKey?: string; tempFileKeys?: string[]; nickname?: string }) {
    try {
      const urls = body.urls || (body.url ? [body.url] : []);
      const tempFileKeys = body.tempFileKeys || (body.tempFileKey ? [body.tempFileKey] : []);

      const result = await this.customSubjectService.parseFileToQuestions(
        '',
        body.subjectId,
        body.subjectName,
        urls,
        tempFileKeys,
        body.nickname
      );

      return { 
        code: 200, 
        msg: 'success', 
        data: result.questions,
        questionsToUpdate: result.questionsToUpdate,
        tempFileKeys: result.tempFileKeys
      };
    } catch (error) {
      console.error('Parse by URL error:', error);
      return { code: 500, msg: '解析失败', data: [] };
    }
  }

  @Post('cleanup')
  @HttpCode(200)
  async cleanup(@Body() body: { tempFileKey?: string; tempFileKeys?: string[] }) {
    const keys = body.tempFileKeys || (body.tempFileKey ? [body.tempFileKey] : []);
    await this.customSubjectService.cleanUpTempFiles(keys);
    return { code: 200, msg: 'success', data: null };
  }

  @Post('import')
  @HttpCode(200)
  async importQuestions(@Body() body: { questions: any[]; questionsToUpdate?: any[]; subjectId: string }) {
    const data = await this.customSubjectService.importQuestions(body.questions, body.subjectId, body.questionsToUpdate);
    return { code: 200, msg: 'success', data };
  }

  @Delete()
  @HttpCode(200)
  async delete(@Query('userId') userId: number, @Query('subjectId') subjectId: string) {
    const data = await this.customSubjectService.deleteCustomSubject(userId, subjectId);
    return { code: 200, msg: 'success', data };
  }
}