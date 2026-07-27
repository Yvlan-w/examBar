import { Controller, Get, Post, Delete, Body, Query, HttpCode } from '@nestjs/common';
import { CustomSubjectService } from './custom-subject.service';

@Controller('custom-subjects')
export class CustomSubjectController {
  constructor(private readonly customSubjectService: CustomSubjectService) {}

  @Post()
  @HttpCode(200)
  async create(@Body() body: { userId: number; name: string; isPublic: boolean }) {
    const data = await this.customSubjectService.createCustomSubject(body.userId, body.name, body.isPublic);
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
    return { code: 200, msg: 'success', data };
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