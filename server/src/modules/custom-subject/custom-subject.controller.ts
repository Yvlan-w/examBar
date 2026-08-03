import { Controller, Get, Post, Delete, Body, Query, Param, HttpCode } from '@nestjs/common';
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

  /**
   * 异步解析接口：立即返回 jobId，后台处理
   */
  @Post('parse-async')
  @HttpCode(200)
  async parseAsync(@Body() body: {
    fileContent?: string;
    url?: string;
    urls?: string[];
    subjectId: string;
    subjectName: string;
    tempFileKey?: string;
    tempFileKeys?: string[];
    nickname?: string;
  }) {
    try {
      const urls = body.urls || (body.url ? [body.url] : []);
      const tempFileKeys = body.tempFileKeys || (body.tempFileKey ? [body.tempFileKey] : []);
      const fileContent = body.fileContent || '';

      const jobId = await this.customSubjectService.createParseJob(
        fileContent,
        body.subjectId,
        body.subjectName,
        urls,
        tempFileKeys,
        body.nickname
      );

      console.log(`[异步解析] 已创建任务: ${jobId}`);
      return { code: 200, msg: 'success', data: { jobId } };
    } catch (error: any) {
      console.error('Parse async error:', error);
      return { code: 500, msg: error.message || '创建解析任务失败', data: null };
    }
  }

  /**
   * 查询解析任务状态
   */
  @Get('parse-status/:jobId')
  @HttpCode(200)
  async getParseStatus(@Param('jobId') jobId: string) {
    const job = this.customSubjectService.getParseJobStatus(jobId);
    
    if (!job) {
      return { code: 404, msg: '任务不存在或已过期', data: null };
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        result: job.status === 'completed' ? {
          questions: job.result?.questions || [],
          questionsToUpdate: job.result?.questionsToUpdate || [],
          tempFileKeys: job.result?.tempFileKeys || [],
        } : null,
      },
    };
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