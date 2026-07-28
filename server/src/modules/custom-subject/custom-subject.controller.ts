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
  async parseFile(@Body() body: { fileContent: string; subjectId: string; subjectName: string }) {
    const data = await this.customSubjectService.parseFileToQuestions(body.fileContent, body.subjectId, body.subjectName);
    return { code: 200, msg: 'success', data: data.questions };
  }

  @Post('parse-url')
  @HttpCode(200)
  async parseByUrl(@Body() body: { url: string; subjectId: string; subjectName: string; tempFileKey?: string }) {
    try {
      const result = await this.customSubjectService.parseFileToQuestions(
        '',
        body.subjectId,
        body.subjectName,
        body.url,
        body.tempFileKey
      );

      return { 
        code: 200, 
        msg: 'success', 
        data: result.questions,
        tempFileKey: result.tempFileKey 
      };
    } catch (error) {
      console.error('Parse by URL error:', error);
      return { code: 500, msg: '解析失败', data: [] };
    }
  }

  @Post('cleanup')
  @HttpCode(200)
  async cleanup(@Body() body: { tempFileKey: string }) {
    await this.customSubjectService.cleanUpTempFile(body.tempFileKey);
    return { code: 200, msg: 'success', data: null };
  }

  @Post('import')
  @HttpCode(200)
  async importQuestions(@Body() body: { questions: any[]; subjectId: string }) {
    const data = await this.customSubjectService.importQuestions(body.questions, body.subjectId);
    return { code: 200, msg: 'success', data };
  }

  @Delete()
  @HttpCode(200)
  async delete(@Query('userId') userId: number, @Query('subjectId') subjectId: string) {
    const data = await this.customSubjectService.deleteCustomSubject(userId, subjectId);
    return { code: 200, msg: 'success', data };
  }
}