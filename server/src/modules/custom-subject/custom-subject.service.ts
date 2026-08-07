import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { customSubjects, questions, subjects, users, answerRecords, favoriteRecords, subjectStats } from '@/db/schema';
import { eq, and, count, or, inArray } from 'drizzle-orm';
import { LLMClient } from 'coze-coding-dev-sdk';
import { StorageService } from '../storage/storage.service';

interface ParseJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: { questions: any[]; questionsToUpdate?: any[]; tempFileKeys?: string[] };
  error?: string;
  createdAt: number;
  progress?: string;
}

@Injectable()
export class CustomSubjectService {
  private llmClient: LLMClient;
  private parseJobs = new Map<string, ParseJob>();
  private readonly JOB_TTL = 30 * 60 * 1000; // 30 分钟过期

  constructor(private readonly storageService: StorageService) {
    this.llmClient = new LLMClient();
    // 定时清理过期任务
    setInterval(() => this.cleanupExpiredJobs(), 5 * 60 * 1000);
  }

  private cleanupExpiredJobs() {
    const now = Date.now();
    for (const [id, job] of this.parseJobs) {
      if (now - job.createdAt > this.JOB_TTL) {
        this.parseJobs.delete(id);
      }
    }
  }

  /**
   * 创建异步解析任务
   */
  async createParseJob(
    fileContent: string,
    subjectId: string,
    subjectName: string,
    urls?: string[],
    tempFileKeys?: string[],
    nickname: string = 'user'
  ): Promise<string> {
    const jobId = `parse_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    
    const job: ParseJob = {
      id: jobId,
      status: 'pending',
      createdAt: Date.now(),
      progress: '任务已创建，等待处理...',
    };
    this.parseJobs.set(jobId, job);

    // 异步执行解析（不 await）
    this.executeParseJob(jobId, fileContent, subjectId, subjectName, urls, tempFileKeys, nickname)
      .catch(err => {
        console.error(`[异步解析任务异常] jobId: ${jobId}`, err);
        const job = this.parseJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = err.message || '解析异常';
        }
      });

    return jobId;
  }

  private async executeParseJob(
    jobId: string,
    fileContent: string,
    subjectId: string,
    subjectName: string,
    urls?: string[],
    tempFileKeys?: string[],
    nickname?: string
  ) {
    const job = this.parseJobs.get(jobId);
    if (!job) return;

    // 进度回调函数
    const onProgress = (progress: string) => {
      const currentJob = this.parseJobs.get(jobId);
      if (currentJob) {
        currentJob.progress = progress;
      }
      console.log(`[异步解析任务] ${jobId} 进度: ${progress}`);
    };

    try {
      job.status = 'processing';
      job.progress = '开始解析...';
      console.log(`[异步解析任务] ${jobId} 开始处理`);

      const result = await this.parseFileToQuestions(
        fileContent, subjectId, subjectName, urls, tempFileKeys, nickname, onProgress
      );

      job.status = 'completed';
      job.result = result;
      job.progress = `解析完成，共 ${result.questions.length} 题`;
      console.log(`[异步解析任务] ${jobId} 完成，解析出 ${result.questions.length} 题`);
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message || '解析失败';
      job.progress = `解析失败: ${error.message || error}`;
      console.error(`[异步解析任务] ${jobId} 失败:`, error.message);
    }
  }

  /**
   * 查询解析任务状态
   */
  getParseJobStatus(jobId: string): ParseJob | null {
    return this.parseJobs.get(jobId) || null;
  }

  async getUniqueName(name: string, userId: number): Promise<string> {
    const cleanedName = name.replace(/\s*by\s+\S+$/, '').replace(/\s*\(\d+\)$/, '').trim();

    const existing = await db.select({ name: customSubjects.name }).from(customSubjects);
    const existingNames = new Set(existing.map((s) => s.name));

    if (!existingNames.has(name)) {
      return name;
    }

    let counter = 1;
    let newName = `${cleanedName}(${counter})`;
    while (existingNames.has(newName)) {
      counter++;
      newName = `${cleanedName}(${counter})`;
    }

    return newName;
  }

  async createCustomSubject(userId: number, name: string, isPublic: boolean, nickname?: string) {
    const uniqueName = await this.getUniqueName(name, userId);

    const finalName = isPublic && nickname 
      ? `${uniqueName} by ${nickname}` 
      : uniqueName;

    const id = 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    
    const colors = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#06B6D4'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    await db.insert(customSubjects).values({
      id,
      userId,
      name: finalName,
      isPublic,
      color,
    });

    await db.insert(subjects).values({
      id,
      name: finalName,
      color,
      questionCount: 0,
    });

    return { id, name: finalName, isPublic, color };
  }

  async toggleVisibility(userId: number, subjectId: string): Promise<{ success: boolean; isPublic: boolean; name: string }> {
    const subjectResult = await db.select().from(customSubjects).where(and(eq(customSubjects.id, subjectId), eq(customSubjects.userId, userId)));
    
    if (subjectResult.length === 0) {
      return { success: false, isPublic: false, name: '' };
    }

    const subject = subjectResult[0];
    const newIsPublic = !subject.isPublic;

    let newName = subject.name;

    if (newIsPublic) {
      const userResult = await db.select({ nickname: users.nickName }).from(users).where(eq(users.id, userId));
      const nickname = userResult[0]?.nickname || '用户';
      
      if (!newName.includes(`by ${nickname}`)) {
        newName = `${newName} by ${nickname}`;
      }
    } else {
      const cleanedName = newName.replace(/\s*by\s+\S+$/, '').trim();
      newName = cleanedName;
    }

    await db.update(customSubjects)
      .set({ isPublic: newIsPublic, name: newName })
      .where(and(eq(customSubjects.id, subjectId), eq(customSubjects.userId, userId)));

    await db.update(subjects)
      .set({ name: newName })
      .where(eq(subjects.id, subjectId));

    return { success: true, isPublic: newIsPublic, name: newName };
  }

  async getCustomSubjects(userId?: number) {
    let results: any[];
    
    if (userId) {
      // 登录用户：返回自己的所有题库 + 其他用户的 public 题库
      results = await db.select().from(customSubjects).where(
        or(
          eq(customSubjects.userId, userId),  // 自己的所有题库（包括 private）
          eq(customSubjects.isPublic, true)   // 所有 public 题库
        )
      );
    } else {
      // 未登录用户：只返回 public 题库
      results = await db.select().from(customSubjects).where(eq(customSubjects.isPublic, true));
    }
    
    const subjectsWithCount = await Promise.all(
      results.map(async (subject) => {
        const countResult = await db.select({ count: count() }).from(questions).where(eq(questions.subjectId, subject.id));
        return {
          ...subject,
          questionCount: countResult[0].count || 0,
        };
      })
    );

    return subjectsWithCount;
  }

  async getPublicSubjects() {
    const results = await db.select().from(customSubjects).where(eq(customSubjects.isPublic, true));
    
    const subjectsWithCount = await Promise.all(
      results.map(async (subject) => {
        const countResult = await db.select({ count: count() }).from(questions).where(eq(questions.subjectId, subject.id));
        return {
          ...subject,
          questionCount: countResult[0].count || 0,
        };
      })
    );

    return subjectsWithCount;
  }

  /**
   * 清理预签名 URL：去除尾部逗号、空格等意外字符
   */
  private cleanUrl(url: string): string {
    if (!url) return url;
    return url.trim().replace(/[,，\s]+$/, '');
  }

  /**
   * 对一组图片 URL 全部执行清理
   */
  private cleanUrls(urls: string[]): string[] {
    return urls.map((u) => this.cleanUrl(u));
  }

  /**
   * 多步骤 JSON 清理 + 解析
   *
   * 针对 LLM 可能返回的非标准 JSON（尾随逗号、未转义换行/引号、
   * 代码块标记、解释性前缀、缺失闭合括号等）逐步修复后再解析。
   * 若整体数组解析仍失败，会尝试用正则逐个抽取题目对象做兜底。
   */
  private cleanAndParseJSON(content: string, tag: string = 'JSON'): any[] {
    let text = (content || '').trim();

    // 1. 去除 markdown 代码块标记
    text = text.replace(/```(?:json|JSON)?\s*/gi, '').replace(/```\s*/g, '');

    // 2. 去除可能存在的解释性前缀（截取第一个 [ 到最后一个 ] 之间的内容）
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      text = text.substring(firstBracket, lastBracket + 1);
    } else {
      // 可能不是数组，尝试截取第一个 { 到最后一个 }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
      }
    }

    // 3. 移除所有尾随逗号（对象尾、数组尾）
    text = text.replace(/,\s*([}\]])/g, '$1');

    // 4. 处理字符串内部未转义的裸换行符
    text = text.replace(/"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g, (match, key, val) => {
      const escapedVal = val
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      return `"${key}":"${escapedVal}"`;
    });

    // 5. 修复对象字符串值里的未转义双引号
    text = text.replace(/"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g, (match, key, val) => {
      const safeVal = val.replace(/(?<!\\)"/g, '\\"');
      return `"${key}":"${safeVal}"`;
    });

    // 6. 尝试补齐缺失的闭合括号
    const openCount = (text.match(/\[/g) || []).length;
    const closeCount = (text.match(/\]/g) || []).length;
    if (openCount > closeCount) {
      text = text + ']'.repeat(openCount - closeCount);
    }

    const openBrace = (text.match(/\{/g) || []).length;
    const closeBrace = (text.match(/\}/g) || []).length;
    if (openBrace > closeBrace) {
      text = text + '}'.repeat(openBrace - closeBrace);
    }

    // 7. 整体解析
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        console.log(`[${tag}] 标准 JSON 解析成功，共 ${parsed.length} 项`);
        return parsed;
      }
      // 单个对象：包装成数组
      if (parsed && typeof parsed === 'object' && parsed.content) {
        console.log(`[${tag}] 解析到单个对象，包装为数组`);
        return [parsed];
      }
    } catch (primaryErr) {
      console.warn(`[${tag}] 标准 JSON 解析失败: ${primaryErr.message}`);
      console.warn(`[${tag}] 待解析文本长度: ${text.length}`);
      console.warn(`[${tag}] 文本尾部 300 字符: ...${text.substring(Math.max(0, text.length - 300))}`);
    }

    // 8. 兜底：用正则逐个抽取题目对象 { ... }
    console.warn(`[${tag}] 尝试正则兜底提取单题对象...`);
    const extracted = this.extractSingleQuestionObjects(text);
    if (extracted.length > 0) {
      console.log(`[${tag}] 兜底提取成功，共 ${extracted.length} 题`);
      return extracted;
    }

    console.warn(`[${tag}] 所有解析策略均失败，返回空数组`);
    return [];
  }

  /**
   * 从一段 JSON 文本中用正则逐个抽取看起来像题目对象的片段。
   * 每个片段都会再走一次独立的 JSON.parse。
   */
  private extractSingleQuestionObjects(text: string): any[] {
    const results: any[] = [];
    // 匹配形如 {"content": ..., "type": ..., ...} 的对象（非贪婪）
    const objectRegex = /\{[^{}]*"content"[^{}]*\}/g;
    let match: RegExpExecArray | null;

    while ((match = objectRegex.exec(text)) !== null) {
      let candidate = match[0];
      // 清理这个对象内部可能的尾随逗号
      candidate = candidate.replace(/,\s*([}\]])/g, '$1');
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && parsed.content && parsed.type) {
          results.push(parsed);
        }
      } catch {
        // 再做一次换行清理后尝试
        candidate = candidate
          .replace(/"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g, (m, k, v) => {
            return `"${k}":"${v.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
          });
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && parsed.content && parsed.type) {
            results.push(parsed);
          }
        } catch {
          // 忽略
        }
      }
    }

    return results;
  }

  /**
   * 带重试的异步执行器
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 2000,
    label: string = 'task'
  ): Promise<T> {
    let lastErr: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        console.warn(`[重试] ${label} 第 ${attempt}/${maxRetries} 次失败: ${err?.message || err}`);
        if (attempt < maxRetries) {
          const delay = baseDelay * attempt;
          console.warn(`[重试] ${label} ${delay}ms 后重试...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastErr;
  }

  private mergeQuestion(existing: any, newQ: any): any {
    const merged = { ...existing };
    
    const fieldsToCheck = ['content', 'type', 'options', 'answer', 'analysis', 'difficulty'];
    
    for (const field of fieldsToCheck) {
      const newValue = newQ[field];
      const existingValue = existing[field];
      
      if (newValue !== undefined && newValue !== null && newValue !== '') {
        if (field === 'options') {
          if ((!existingValue || existingValue.length === 0) && newValue.length > 0) {
            merged[field] = newValue;
          }
        } else if (field === 'answer') {
          if (!existingValue || existingValue === '') {
            merged[field] = newValue;
          }
        } else if (field === 'analysis') {
          if (!existingValue || existingValue === '') {
            merged[field] = newValue;
          } else if (newValue.length > existingValue.length) {
            merged[field] = newValue;
          }
        } else if (field === 'difficulty') {
          if (!existingValue || existingValue === 'easy') {
            merged[field] = newValue;
          }
        } else {
          if (!existingValue || existingValue === '') {
            merged[field] = newValue;
          }
        }
      }
    }
    
    return merged;
  }

  private hasNewInfo(existing: any, merged: any): boolean {
    const fieldsToCheck = ['content', 'type', 'options', 'answer', 'analysis', 'difficulty'];
    
    for (const field of fieldsToCheck) {
      if (JSON.stringify(existing[field]) !== JSON.stringify(merged[field])) {
        return true;
      }
    }
    
    return false;
  }

  async parseFileToQuestions(
    fileContent: string, 
    subjectId: string, 
    subjectName: string,
    urls?: string[],
    tempFileKeys?: string[],
    nickname: string = 'user',
    onProgress?: (progress: string) => void
  ): Promise<{ questions: any[]; questionsToUpdate?: any[]; tempFileKeys?: string[] }> {
    let finalTempFileKeys = tempFileKeys || [];
    
    try {
      console.log('\n=====================================');
      console.log('=== LLM 题目解析流程开始 ===');
      console.log('=====================================');
      console.log('[输入参数] subjectId:', subjectId);
      console.log('[输入参数] subjectName:', subjectName);
      console.log('[输入参数] nickname:', nickname);
      console.log('[输入参数] urls数量:', urls?.length || 0);
      console.log('[输入参数] hasFileContent:', !!fileContent && fileContent.length > 0);
      if (fileContent && fileContent.length > 0) {
        console.log('[输入参数] fileContent长度:', fileContent.length);
        console.log('[输入参数] fileContent前200字符:', fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : ''));
      }
      if (urls && urls.length > 0) {
        urls.forEach((url, index) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url.split('?')[0]);
          const isDocx = /\.docx$/i.test(url.split('?')[0]);
          const isDoc = /\.doc$/i.test(url.split('?')[0]);
          const isPdf = /\.pdf$/i.test(url.split('?')[0]);
          const type = isDocx ? 'DOCX文件' : isDoc ? 'DOC文件' : isPdf ? 'PDF文件' : isImage ? '图片' : '资源';
          console.log(`[输入参数] ${type}${index + 1} URL:`, url.substring(0, 100) + (url.length > 100 ? '...' : ''));
        });
      }

      let finalUrls = urls || [];
      let finalFileContent = fileContent;

      // 检查 URL 或 tempFileKeys 是否包含 DOCX（直接解析文本）或 DOC（转 PDF）
      const firstUrl = finalUrls[0] || '';
      const isDocxUrl = firstUrl.toLowerCase().includes('.docx') || 
        (tempFileKeys && tempFileKeys.length > 0 && tempFileKeys.some(key => key.toLowerCase().includes('.docx')));
      const isDocUrl = firstUrl.toLowerCase().includes('.doc') && !firstUrl.toLowerCase().includes('.docx') ||
        (tempFileKeys && tempFileKeys.length > 0 && tempFileKeys.some(key => key.toLowerCase().includes('.doc') && !key.toLowerCase().includes('.docx')));
      
      console.log(`[DOCX检测] isDocxUrl: ${isDocxUrl}`);
      console.log(`[DOC检测] isDocUrl: ${isDocUrl}`);
      
      // 处理 .docx 文件：直接解析文本
      if (isDocxUrl) {
        console.log('[DOCX处理] 检测到 .docx 文件，开始解析文本...');
        
        try {
          let docxUrl = firstUrl;
          if (tempFileKeys && tempFileKeys.length > 0) {
            const docxKey = tempFileKeys.find(key => key.toLowerCase().includes('.docx')) || tempFileKeys[0];
            docxUrl = await this.getPresignedUrl(docxKey);
          }
          
          console.log(`[DOCX处理] 下载 URL: ${docxUrl.substring(0, 100)}...`);
          
          // 下载文件并解析
          const docxBuffer = await this.downloadFileFromUrl(docxUrl);
          const textContent = await this.storageService.parseDocxToText(docxBuffer);
          
          console.log(`[DOCX处理] 解析完成，文本长度: ${textContent.length} chars`);
          
          // 使用解析后的文本作为 fileContent
          finalFileContent = textContent;
          // 清空 URL，使用文本模式
          finalUrls = [];
          
          console.log('[DOCX处理] 将使用文本模式解析题目');
        } catch (docxError) {
          console.error('[DOCX处理] DOCX 解析失败:', docxError);
          throw new Error(`DOCX 解析失败: ${docxError.message || docxError}`);
        }
      }
      
      // 处理 .doc 文件：直接解析文本（使用 word-extractor）
      if (isDocUrl) {
        console.log('[DOC处理] 检测到 .doc 文件，开始解析文本...');
        
        try {
          let docUrl = firstUrl;
          if (tempFileKeys && tempFileKeys.length > 0) {
            const docKey = tempFileKeys.find(key => key.toLowerCase().includes('.doc') && !key.toLowerCase().includes('.docx')) || tempFileKeys[0];
            docUrl = await this.getPresignedUrl(docKey);
          }
          
          console.log(`[DOC处理] 下载 URL: ${docUrl.substring(0, 100)}...`);
          
          // 下载文件并解析
          const docBuffer = await this.downloadFileFromUrl(docUrl);
          const textContent = await this.storageService.parseDocToText(docBuffer);
          
          console.log(`[DOC处理] 解析完成，文本长度: ${textContent.length} chars`);
          
          // 使用解析后的文本作为 fileContent
          finalFileContent = textContent;
          // 清空 URL，使用文本模式
          finalUrls = [];
          
          console.log('[DOC处理] 将使用文本模式解析题目');
        } catch (docError) {
          console.error('[DOC处理] DOC 解析失败:', docError);
          throw new Error(`DOC 解析失败: ${docError.message || docError}`);
        }
      }

      // 检查是否是 PDF 文件
      const isPdfUrl = firstUrl.toLowerCase().includes('.pdf') || 
        (tempFileKeys && tempFileKeys.length > 0 && tempFileKeys.some(key => key.toLowerCase().includes('.pdf')));
      
      console.log(`[PDF检测] firstUrl: ${firstUrl.substring(0, 100)}`);
      console.log(`[PDF检测] isPdfUrl: ${isPdfUrl}`);
      console.log(`[PDF检测] tempFileKeys: ${JSON.stringify(tempFileKeys)}`);

      if (isPdfUrl) {
        console.log('[PDF处理] 检测到 PDF 文件，开始转换为图片...');
        
        try {
          // 获取 PDF 的预签名 URL
          let pdfUrl = firstUrl;
          if (tempFileKeys && tempFileKeys.length > 0) {
            const pdfKey = tempFileKeys.find(key => key.toLowerCase().includes('.pdf')) || tempFileKeys[0];
            pdfUrl = await this.getPresignedUrl(pdfKey);
          }
          
          console.log(`[PDF处理] PDF URL: ${pdfUrl.substring(0, 100)}...`);
          
          const { imageUrls: convertedUrls, tempFileKeys: convertedKeys } = 
            await this.storageService.convertPdfToImages(pdfUrl);
          
          console.log(`[PDF处理] 转换完成，共 ${convertedUrls.length} 张图片`);
          
          // 使用转换后的图片 URL
          finalUrls = convertedUrls;
          
          // 更新 tempFileKeys：保留原始 PDF 的 key + 转换后图片的 key
          if (tempFileKeys && tempFileKeys.length > 0) {
            finalTempFileKeys = [...tempFileKeys, ...convertedKeys];
          } else {
            finalTempFileKeys = convertedKeys;
          }
          
          console.log(`[PDF处理] finalUrls数量: ${finalUrls.length}`);
          console.log(`[PDF处理] finalTempFileKeys数量: ${finalTempFileKeys.length}`);
        } catch (pdfError) {
          console.error('[PDF处理] PDF 转换失败:', pdfError);
          throw new Error(`PDF 转换失败: ${pdfError.message || pdfError}`);
        }
      }

      let parsedQuestions: any[] = [];
      
      if (finalUrls && finalUrls.length > 0) {
        console.log(`[LLM请求] 使用图片模式，共 ${finalUrls.length} 张图片`);
        
        // 判断是否需要分批解析
        if (finalUrls.length > CustomSubjectService.TOTAL_PAGE_THRESHOLD) {
          console.log(`[LLM请求] 图片数量超过 ${CustomSubjectService.TOTAL_PAGE_THRESHOLD}，启用分批解析`);
          parsedQuestions = await this.parseImagesInBatches(finalUrls, onProgress);
        } else {
          // 单批次直接解析
          console.log(`[LLM请求] 单批次解析，共 ${finalUrls.length} 张图片`);
          onProgress?.('解析中...');
          parsedQuestions = await this.parseBatch(finalUrls, 0, 1);
        }
      } else {
        // 防御性检查：确保 finalFileContent 不为 undefined 或空
        console.log(`[LLM请求] 使用文本模式，文本长度: ${(finalFileContent || '').length} chars`);
        
        if (!finalFileContent || finalFileContent.trim().length === 0) {
          console.warn('[LLM请求] ⚠️ 文本内容为空，可能无法解析题目');
        }

        // 文本模式保持原有逻辑
        const userMessageContent = finalFileContent || '';
        onProgress?.('解析中...');
        
        const messages = [
          {
            role: 'system' as const,
            content: `你是一个专业的题目解析助手。请将以下文本内容解析为结构化的题目数据。
# 硬性强制输出规则【最高优先级，必须遵守】
1. 最终输出**只能返回纯净JSON**，不要任何前置说明、解释、markdown、注释、换行说明、结束语；不能出现\`\`\`json代码块标记。
2. 严格遵守字段结构，不新增字段、不缺失字段、不修改key名称。
3. 输出完成后自检一遍JSON语法，确保可以直接使用 JSON.parse() 正常解析。

# 题型定义
可选type枚举：choice / multi / judge / short
1. choice 单项选择题
    options：数组，{"label":"A","content":"选项文本"}，严格沿用原题选项标识
    answer：选项label字符串，例"A"/"B"
2. multi 多项/不定项选择题
    options：数组，{"label":"A","content":"选项文本"}，严格沿用原题选项标识
    answer：多个选项label用逗号分隔，例"A,B,C"
3. judge 判断题
    options固定为：[{"label":"A","content":"正确"},{"label":"B","content":"错误"}]
    answer："A"代表正确，"B"代表错误
4. short 简答题
    options：空数组 []
    answer：文字形式参考答案

# 单题字段规范
{
  "content": "完整题干文本，去除多余无关符号",
  "type": "choice | multi | judge | short",
  "options": [],
  "answer": "答案（multi类型用逗号分隔多个选项，如A,B,C）",
  "analysis": "专业解析，阐明原理、考点、易错点；原文无解析则自主生成合理解析",
  "difficulty": "easy | medium | hard"
}

# 难度判定标准
easy：基础概念、记忆类、一眼可判断答案
medium：需要简单理解、对比分析，常规考核题型
hard：综合知识点、计算、易混淆辨析、拓展应用类题目

# 额外业务规则
1. 题干、选项文字做清洗：去除空格、乱码、多余换行；保证文本通顺；
2. 若原始素材缺失标准答案，尽可能基于专业知识给出合理参考答案，但是必须给出参考来源，不得编造事实；无法判断时在analysis注明「原题未提供标准答案，解析仅供参考」；
3. 不要自行编造不存在的题干与选项；识别不到有效题目返回空数组 []。
4. JSON语法规范：
   - 键名统一英文双引号；
   - 对象、数组末尾元素**禁止尾随逗号**；
   - 字符串内部换行使用转义字符 \n，不要裸换行；
   - 不存在字段如实简答题options，赋值为空数组 []，不要null；
5. 不要简写JSON，要使用双引号包裹字符串。
6. 全文只允许出现唯一一对顶层 [ ]，输出文本结尾不要额外出现任何 [ ] 符号，不要在 JSON 外部增加任何带方括号的备注。

模板标准样例：
[
    {
        "content": "关于合规管理说法错误的是？",
        "type": "choice",
        "options": [
            {"label":"A","content":"合规管理需要遵循法律法规"},
            {"label":"B","content":"合规管理不需要遵循法律法规"},
            {"label":"C","content":"合规管理应覆盖所有业务领域"},
            {"label":"D","content":"合规管理需要全员参与"}
        ],
        "answer": "B",
        "analysis": "企业合规管理首要前提就是严格遵守国家各项法律法规，因此B选项表述错误。",
        "difficulty": "easy"
    },
    {
        "content": "证券从业人员禁止从事的行为是（）。",
        "type": "choice",
        "options": [
            {"label": "A","content": "依法开展投资者适当性匹配"},
            {"label": "B","content": "私下接受客户委托买卖证券"},
            {"label": "C","content": "履行信息披露义务"},
            {"label": "D","content": "开展常态化投资者教育"}
        ],  
        "answer": "B",
        "analysis": "根据《证券从业人员执业行为准则》，证券从业人员不得私下接受客户委托买卖证券，其余选项均为从业人员应当或可以开展的合规行为，因此本题选B。",
        "difficulty": "easy"
    }
]
`,
          },
          {
            role: 'user' as const,
            content: userMessageContent,
          },
        ];

        console.log('[LLM请求] 消息数量:', messages.length);

        const content = await this.withRetry(
          async () => {
            const response = await this.llmClient.invoke(messages, {
              model: 'doubao-seed-2-0-lite-260215',
            });
            return response.content || '';
          },
          3,
          3000,
          '文本模式 LLM 调用'
        );

        console.log('\n[LLM响应] 原始内容长度:', content.length);

        parsedQuestions = this.cleanAndParseJSON(content, '文本模式');
      }

      console.log('[解析结果] 解析出题目数量:', parsedQuestions.length);
      if (parsedQuestions.length > 0) {
        console.log('[解析结果] 第一题:', JSON.stringify(parsedQuestions[0], null, 2));
        if (parsedQuestions.length > 1) {
          console.log('[解析结果] 最后一题:', JSON.stringify(parsedQuestions[parsedQuestions.length - 1], null, 2));
        }
      }

      const existingQuestions = await db.select({ content: questions.content, id: questions.id }).from(questions).where(eq(questions.subjectId, subjectId));
      const existingContents = new Set(existingQuestions.map((q) => q.content.trim()));

      console.log('[去重检查] 题库中已有题目数量:', existingQuestions.length);

      const existingMap = new Map(existingQuestions.map(q => [q.content.trim(), q]));
      
      const questionsToInsert: any[] = [];
      const questionsToUpdate: any[] = [];
      let mergedCount = 0;

      for (const q of parsedQuestions) {
        if (!q.content) continue;
        
        const existing = existingMap.get(q.content.trim());
        
        if (existing) {
          const merged = this.mergeQuestion(existing, q);
          if (this.hasNewInfo(existing, merged)) {
            questionsToUpdate.push({ id: existing.id, ...merged });
            mergedCount++;
          }
        } else {
          questionsToInsert.push(q);
        }
      }

      console.log('[去重结果] 新题目数量:', questionsToInsert.length);
      console.log('[去重结果] 合并更新题目数量:', mergedCount);
      console.log('[去重结果] 重复但无需更新数量:', parsedQuestions.length - questionsToInsert.length - mergedCount);

      const cleanNickname = nickname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 10);
      const cleanSubjectName = subjectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').replace(/by\s+\S+$/, '').trim().substring(0, 15);

      console.log('[ID生成] cleanNickname:', cleanNickname);
      console.log('[ID生成] cleanSubjectName:', cleanSubjectName);

      let maxSequence = 0;
      for (const q of existingQuestions) {
        const idPattern = new RegExp(`^q_${cleanNickname}_${cleanSubjectName}_(\\d+)$`);
        const idMatch = q.id.match(idPattern);
        if (idMatch) {
          const seq = parseInt(idMatch[1], 10);
          if (!isNaN(seq) && seq > maxSequence) {
            maxSequence = seq;
          }
        }
      }

      const finalNewQuestions = questionsToInsert.map((q, index) => {
        const seq = maxSequence + index + 1;
        const id = `q_${cleanNickname}_${cleanSubjectName}_${seq}`;
        // 确保 ID 不超过 32 字符限制
        const truncatedId = id.length > 32 ? id.substring(id.length - 32) : id;
        
        return {
          ...q,
          id: truncatedId,
          subjectId,
          subjectName,
          createdAt: new Date(),
        };
      });

      console.log('[ID生成] 最大序列号:', maxSequence);
      console.log('[最终结果] 新增题目数量:', finalNewQuestions.length);
      console.log('[最终结果] 更新题目数量:', questionsToUpdate.length);
      if (finalNewQuestions.length > 0) {
        console.log('[最终结果] 第一题ID:', finalNewQuestions[0].id);
        console.log('[最终结果] 最后一题ID:', finalNewQuestions[finalNewQuestions.length - 1].id);
      }
      console.log('=====================================');
      console.log('=== LLM 题目解析流程结束 ===');
      console.log('=====================================\n');

      return { 
        questions: finalNewQuestions, 
        questionsToUpdate,
        tempFileKeys: finalTempFileKeys
      };
    } catch (error) {
      console.error('=====================================');
      console.error('=== LLM 题目解析流程出错 ===');
      console.error('=====================================');
      console.error('[错误]', error);
      console.error('=====================================\n');
      return { questions: [], questionsToUpdate: [], tempFileKeys: finalTempFileKeys };
    }
  }

  /**
   * 从 URL 下载文件（委托给 StorageService）
   */
  private async downloadFileFromUrl(url: string): Promise<Buffer> {
    return this.storageService.downloadFile(url);
  }

  /**
   * 获取文件的预签名 URL
   */
  private async getPresignedUrl(key: string): Promise<string> {
    try {
      return await this.storageService.generatePresignedUrl(key, 3600);
    } catch (error) {
      console.error('[获取URL失败]', error);
      throw error;
    }
  }

  // 分批解析配置
  private static readonly MAX_IMAGES_PER_BATCH = 8;
  private static readonly MIN_IMAGES_PER_BATCH = 3;
  private static readonly TOTAL_PAGE_THRESHOLD = 8;

  /**
   * 快速分析图片集合并识别题目边界
   * 返回不完整页面的索引数组（作为拆分点）
   */
  private async analyzeImageBoundaries(imageUrls: string[]): Promise<number[]> {
    const cleanedUrls = this.cleanUrls(imageUrls);
    console.log(`[智能分页] 开始分析 ${cleanedUrls.length} 张图片的题目边界...`);

    try {
      const messages = [
        {
          role: 'system' as const,
          content: `你是一个文档分析专家。请分析每一页图片，判断该页是否以完整的题目结束。
你需要返回一个JSON数组，每个元素对应一页的分析结果。

分析规则：
1. 如果该页最后一个题目是完整的（题干和选项都在本页），标记为{"complete": true}
2. 如果该页最后一个题目不完整（题干在本页，选项在下一页），标记为{"complete": false}
3. 如果该页没有题目，标记为{"complete": true}

输出格式：严格返回JSON数组，如 [{"complete":true}, {"complete":false}, ...]
只能返回JSON，不要其他内容。`,
        },
        {
          role: 'user' as const,
          content: cleanedUrls.map((url) => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'low' as const },
          })),
        },
      ];

      const content = await this.withRetry(
        async () => {
          const response = await this.llmClient.invoke(messages, {
            model: 'doubao-seed-2-0-lite-260215',
          });
          return response.content || '';
        },
        2,
        3000,
        '智能分页 LLM 调用'
      );

      const text = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const boundaries = this.cleanAndParseJSON(text, '智能分页');

      if (!boundaries || boundaries.length === 0) {
        console.warn('[智能分页] 无法解析LLM响应，默认均匀分页');
        return this.getDefaultSplitPoints(cleanedUrls.length, []);
      }

      console.log('[智能分页] 每页边界状态:', boundaries.map((b: any, i: number) => `页${i}:${b.complete}`));

      const incompletePages: number[] = [];
      for (let i = 0; i < boundaries.length; i++) {
        if (boundaries[i]?.complete === false) {
          incompletePages.push(i);
        }
      }

      console.log(`[智能分页] 发现 ${incompletePages.length} 个不完整页面:`, incompletePages);
      return this.getDefaultSplitPoints(cleanedUrls.length, incompletePages);
    } catch (error) {
      console.error('[智能分页] 分析失败，使用默认分页:', error);
      return this.getDefaultSplitPoints(imageUrls.length, []);
    }
  }

  /**
   * 根据不完整页面计算最优拆分点
   * 规则：
   * 1. 不完整页面是强制拆分点（在该页之前拆分）
   * 2. 每个批次至少包含 MIN_IMAGES_PER_BATCH 张图片
   * 3. 每个批次最多包含 MAX_IMAGES_PER_BATCH 张图片
   * 4. 过小的批次会被合并到相邻批次
   */
  private getDefaultSplitPoints(totalPages: number, incompletePages: number[]): number[] {
    const MIN_SIZE = CustomSubjectService.MIN_IMAGES_PER_BATCH;
    const MAX_SIZE = CustomSubjectService.MAX_IMAGES_PER_BATCH;
    
    // 如果没有不完整页面，按固定大小分组
    if (incompletePages.length === 0) {
      const splitPoints: number[] = [];
      for (let i = MAX_SIZE - 1; i < totalPages; i += MAX_SIZE) {
        splitPoints.push(Math.min(i, totalPages - 1));
      }
      if (splitPoints.length === 0 || splitPoints[splitPoints.length - 1] !== totalPages - 1) {
        splitPoints.push(totalPages - 1);
      }
      console.log(`[智能分页] 无不完整页面，按 ${MAX_SIZE} 页一组，分为 ${splitPoints.length} 组`);
      return Array.from(new Set(splitPoints)).sort((a, b) => a - b);
    }

    // 构建初始分组：以不完整页面为拆分点
    const rawGroups: number[][] = [];
    let startIdx = 0;
    
    for (const incompletePage of incompletePages) {
      // 在不完整页面之前拆分
      const endIdx = Math.min(incompletePage + 1, totalPages);
      if (endIdx > startIdx) {
        rawGroups.push([startIdx, endIdx]);
        startIdx = endIdx;
      }
    }
    // 添加最后一组
    if (startIdx < totalPages) {
      rawGroups.push([startIdx, totalPages]);
    }

    console.log(`[智能分页] 初始分组（基于不完整页面）: ${rawGroups.map(g => `${g[0]}-${g[1]}`)}`);

    // 合并过小的批次
    const mergedGroups: number[][] = [];
    let tempGroup: number[] | null = null;

    for (const group of rawGroups) {
      const groupSize = group[1] - group[0];
      
      if (tempGroup) {
        // 当前批次 + 临时批次
        const combinedSize = group[1] - tempGroup[0];
        
        if (combinedSize <= MAX_SIZE) {
          // 合并后不超过最大限制，合并
          tempGroup = [tempGroup[0], group[1]];
        } else {
          // 合并后超过最大限制，保存临时批次，开始新的
          mergedGroups.push(tempGroup);
          tempGroup = [...group];
        }
      } else {
        if (groupSize < MIN_SIZE && mergedGroups.length > 0) {
          // 当前批次太小，合并到上一个已保存的批次
          const lastGroup = mergedGroups[mergedGroups.length - 1];
          const combinedSize = group[1] - lastGroup[0];
          
          if (combinedSize <= MAX_SIZE) {
            // 合并后不超过最大限制
            mergedGroups[mergedGroups.length - 1] = [lastGroup[0], group[1]];
          } else {
            // 合并后超过最大限制，仍然单独保留
            mergedGroups.push([...group]);
          }
        } else {
          tempGroup = [...group];
        }
      }
    }
    
    if (tempGroup) {
      // 检查最后的临时批次是否需要合并到上一个
      if (mergedGroups.length > 0) {
        const lastGroup = mergedGroups[mergedGroups.length - 1];
        const combinedSize = tempGroup[1] - lastGroup[0];
        const tempSize = tempGroup[1] - tempGroup[0];
        
        // 如果临时批次太小，且合并后不超过最大限制
        if (tempSize < MIN_SIZE && combinedSize <= MAX_SIZE) {
          mergedGroups[mergedGroups.length - 1] = [lastGroup[0], tempGroup[1]];
        } else {
          mergedGroups.push(tempGroup);
        }
      } else {
        mergedGroups.push(tempGroup);
      }
    }

    console.log(`[智能分页] 合并后分组: ${mergedGroups.map(g => `${g[0]}-${g[1]}(${g[1]-g[0]}页)`)}`);

    // 处理过大的批次（按最大限制拆分）
    const finalGroups: number[][] = [];
    for (const group of mergedGroups) {
      const [start, end] = group;
      const size = end - start;
      
      if (size <= MAX_SIZE) {
        finalGroups.push([start, end]);
      } else {
        // 过大的批次，按 MAX_SIZE 拆分
        let groupStart = start;
        while (groupStart < end) {
          const groupEnd = Math.min(groupStart + MAX_SIZE, end);
          finalGroups.push([groupStart, groupEnd]);
          groupStart = groupEnd;
        }
      }
    }

    console.log(`[智能分页] 最终分组: ${finalGroups.map(g => `${g[0]}-${g[1]}(${g[1]-g[0]}页)`)}`);

    // 转换为拆分点（每个批次的最后一页索引）
    const splitPoints = finalGroups.map(g => g[1] - 1);
    return splitPoints;
  }

  /**
   * 旧版默认均匀分页（保留兼容性）
   */
  private getDefaultBoundaries(totalPages: number): number[] {
    const boundaries: number[] = [];
    const batchSize = CustomSubjectService.MAX_IMAGES_PER_BATCH;
    for (let i = batchSize - 1; i < totalPages; i += batchSize) {
      boundaries.push(Math.min(i, totalPages - 1));
    }
    if (boundaries.length === 0 || boundaries[boundaries.length - 1] !== totalPages - 1) {
      boundaries.push(totalPages - 1);
    }
    return Array.from(new Set(boundaries)).sort((a, b) => a - b);
  }

  /**
   * 根据边界将图片分成批次
   */
  private splitImagesByBoundaries(imageUrls: string[], boundaries: number[]): string[][] {
    const batches: string[][] = [];
    let startIdx = 0;

    for (const boundary of boundaries) {
      const endIdx = Math.min(boundary + 1, imageUrls.length);
      const batch = imageUrls.slice(startIdx, endIdx);
      if (batch.length > 0) {
        batches.push(batch);
      }
      startIdx = endIdx;
    }

    // 处理剩余的图片
    if (startIdx < imageUrls.length) {
      batches.push(imageUrls.slice(startIdx));
    }

    console.log(`[智能分页] 分为 ${batches.length} 个批次，每批:`, batches.map(b => b.length));
    return batches;
  }

  /**
   * 解析单个批次的图片
   */
  private async parseBatch(
    batchImages: string[],
    batchIndex: number,
    totalBatches: number
  ): Promise<any[]> {
    const cleanedImages = this.cleanUrls(batchImages);
    console.log(`[批次解析] 开始解析第 ${batchIndex + 1}/${totalBatches} 批，共 ${cleanedImages.length} 张图片`);
    cleanedImages.forEach((u, i) => {
      console.log(`[批次解析] 图片${i + 1}: ${u.substring(0, 120)}`);
    });

    const systemPrompt = totalBatches > 1
      ? `你是一个专业的题目解析助手。请将以下图片内容解析为结构化的题目数据。

# 当前上下文
这是第 ${batchIndex + 1}/${totalBatches} 批图片。
${batchIndex > 0 ? '注意：第一个题目可能不完整，请忽略不完整的题目。' : ''}
${batchIndex < totalBatches - 1 ? '注意：最后一个题目可能不完整，请忽略不完整的题目。' : ''}

# 硬性强制输出规则【最高优先级，必须遵守】
1. 最终输出**只能返回纯净JSON数组**，不要任何前置说明、解释、markdown、注释。
2. 严格遵守字段结构，不新增字段、不缺失字段、不修改key名称。
3. 对于不完整的题目（题干或选项缺失），直接忽略，不要返回。

# 题型定义
可选type枚举：choice / multi / judge / short
1. choice 单项选择题
    options：数组，{"label":"A","content":"选项文本"}，严格沿用原题选项标识
    answer：选项label字符串，例"A"/"B"
2. multi 多项/不定项选择题
    options：数组，{"label":"A","content":"选项文本"}，严格沿用原题选项标识
    answer：多个选项label用逗号分隔，例"A,B,C"
3. judge 判断题
    options固定为：[{"label":"A","content":"正确"},{"label":"B","content":"错误"}]
    answer："A"代表正确，"B"代表错误
4. short 简答题
    options：空数组 []
    answer：文字形式参考答案

# 单题字段规范
{
  "content": "完整题干文本",
  "type": "choice | multi | judge | short",
  "options": [],
  "answer": "答案",
  "analysis": "专业解析",
  "difficulty": "easy | medium | hard"
}`
      : `你是一个专业的题目解析助手。请将以下图片内容解析为结构化的题目数据。

# 硬性强制输出规则【最高优先级，必须遵守】
1. 最终输出**只能返回纯净JSON数组**，不要任何前置说明、解释、markdown、注释。
2. 严格遵守字段结构，不新增字段、不缺失字段、不修改key名称。

# 题型定义
可选type枚举：choice / multi / judge / short
1. choice 单项选择题
    options：数组，{"label":"A","content":"选项文本"}，严格沿用原题选项标识
    answer：选项label字符串，例"A"/"B"
2. multi 多项/不定项选择题
    options：数组，{"label":"A","content":"选项文本"}，严格沿用原题选项标识
    answer：多个选项label用逗号分隔，例"A,B,C"
3. judge 判断题
    options固定为：[{"label":"A","content":"正确"},{"label":"B","content":"错误"}]
    answer："A"代表正确，"B"代表错误
4. short 简答题
    options：空数组 []
    answer：文字形式参考答案

# 单题字段规范
{
  "content": "完整题干文本",
  "type": "choice | multi | judge | short",
  "options": [],
  "answer": "答案",
  "analysis": "专业解析",
  "difficulty": "easy | medium | hard"
}`;

    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      {
        role: 'user' as const,
        content: cleanedImages.map((url) => ({
          type: 'image_url' as const,
          image_url: { url, detail: 'high' as const },
        })),
      },
    ];

    try {
      const content = await this.withRetry(
        async () => {
          const response = await this.llmClient.invoke(messages, {
            model: 'doubao-seed-2-0-lite-260215',
          });
          return response.content || '';
        },
        3,
        3000,
        `第${batchIndex + 1}/${totalBatches}批 LLM 调用`
      );

      console.log(`[批次解析] 第${batchIndex + 1}批 LLM响应长度: ${content.length}`);

      const parsed = this.cleanAndParseJSON(content, `第${batchIndex + 1}批`);

      const validQuestions = parsed.filter((q: any) =>
        q && q.content && q.answer && q.type && q.content.trim().length > 10
      );

      console.log(`[批次解析] 第${batchIndex + 1}批 解析出 ${validQuestions.length} 道有效题目`);
      return validQuestions;
    } catch (error) {
      console.error(`[批次解析] 第${batchIndex + 1}批 全部重试后仍失败:`, error);
      return [];
    }
  }

  /**
   * 分批解析图片
   */
  private async parseImagesInBatches(
    imageUrls: string[],
    onProgress?: (progress: string) => void
  ): Promise<any[]> {
    const totalImages = imageUrls.length;

    // 单批次直接解析
    if (totalImages <= CustomSubjectService.MAX_IMAGES_PER_BATCH) {
      onProgress?.('解析中...');
      return this.parseBatch(imageUrls, 0, 1);
    }

    // 多批次：先分析边界
    onProgress?.('分析文档结构...');
    const boundaries = await this.analyzeImageBoundaries(imageUrls);
    
    // 根据边界分批
    const batches = this.splitImagesByBoundaries(imageUrls, boundaries);
    const allQuestions: any[] = [];

    for (let i = 0; i < batches.length; i++) {
      onProgress?.(`解析中 (${i + 1}/${batches.length})...`);
      
      // 批次间稍作间隔，避免LLM限流
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const batchQuestions = await this.parseBatch(batches[i], i, batches.length);
      allQuestions.push(...batchQuestions);
      
      console.log(`[分批解析] 累计解析 ${allQuestions.length} 题`);
    }

    console.log(`[分批解析] 全部完成，共 ${allQuestions.length} 题`);
    return allQuestions;
  }

  async cleanUpTempFiles(keys?: string[]): Promise<void> {
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => this.storageService.deleteFile(key)));
      console.log('[清理] 已删除', keys.length, '个临时文件');
    }
  }

  async importQuestions(questionsData: any[], subjectId: string, questionsToUpdate?: any[]) {
    let insertedCount = 0;
    let updatedCount = 0;

    console.log(`[导入开始] 待插入题目: ${questionsData.length}, 待更新题目: ${questionsToUpdate?.length || 0}, 题库ID: ${subjectId}`);

    try {
      // 验证题库是否存在
      const subjectCheck = await db.select().from(subjects).where(eq(subjects.id, subjectId));
      if (subjectCheck.length === 0) {
        console.error(`[导入失败] 题库不存在: ${subjectId}`);
        throw new Error(`题库不存在，无法导入题目`);
      }
      console.log(`[导入验证] 题库存在: ${subjectCheck[0].name}`);

      // 规范化题目数据
      const normalizeQuestion = (q: any): any | null => {
        if (!q || !q.content || !q.answer || !q.type) {
          console.warn(`[数据验证] 题目缺少必要字段: id=${q?.id}, content=${!!q?.content}, answer=${!!q?.answer}, type=${!!q?.type}`);
          return null;
        }

        // 规范化 type 字段
        const validTypes = ['choice', 'multi', 'judge', 'short'];
        let normalizedType = q.type;
        if (!validTypes.includes(normalizedType)) {
          if (normalizedType === 'single') normalizedType = 'choice';
          else if (normalizedType === 'multiple') normalizedType = 'multi';
          else if (normalizedType === 'truefalse' || normalizedType === 'boolean') normalizedType = 'judge';
          else normalizedType = 'choice';
        }

        // 规范化 difficulty 字段
        const validDifficulties = ['easy', 'medium', 'hard'];
        let normalizedDifficulty = q.difficulty || 'easy';
        if (!validDifficulties.includes(normalizedDifficulty)) {
          if (normalizedDifficulty === '简单' || normalizedDifficulty === '容易') normalizedDifficulty = 'easy';
          else if (normalizedDifficulty === '中等' || normalizedDifficulty === '一般') normalizedDifficulty = 'medium';
          else if (normalizedDifficulty === '困难' || normalizedDifficulty === '难') normalizedDifficulty = 'hard';
          else normalizedDifficulty = 'easy';
        }

        // 处理 options 字段
        let normalizedOptions = q.options;
        if (normalizedOptions && typeof normalizedOptions === 'string') {
          try {
            normalizedOptions = JSON.parse(normalizedOptions);
          } catch {
            normalizedOptions = null;
          }
        }
        if (normalizedOptions && !Array.isArray(normalizedOptions)) {
          normalizedOptions = null;
        }

        // 清理 createdAt，只保留数据库 schema 中的字段
        const { createdAt, year, ...otherFields } = q;
        
        // 处理 year 字段
        let normalizedYear = year;
        if (normalizedYear !== undefined && normalizedYear !== null) {
          const yearNum = typeof normalizedYear === 'number' ? normalizedYear : parseInt(String(normalizedYear), 10);
          if (!isNaN(yearNum) && yearNum > 1900 && yearNum < 2100) {
            normalizedYear = yearNum;
          } else {
            normalizedYear = undefined;
          }
        }

        const result: any = {
          id: q.id,
          content: q.content,
          type: normalizedType,
          options: normalizedOptions,
          answer: q.answer,
          analysis: q.analysis || '',
          difficulty: normalizedDifficulty,
          subjectId: q.subjectId,
          subjectName: q.subjectName,
        };
        
        if (normalizedYear !== undefined) {
          result.year = normalizedYear;
        }
        
        return result;
      };

      if (questionsData.length > 0) {
        const questionsToInsert: any[] = [];
        let skippedCount = 0;

        for (const q of questionsData) {
          const normalized = normalizeQuestion(q);
          if (normalized) {
            // 确保 id 存在且不超过32字符
            if (!normalized.id) {
              console.warn(`[数据验证] 题目缺少id，跳过: ${normalized.content?.substring(0, 50)}`);
              skippedCount++;
              continue;
            }
            if (normalized.id.length > 32) {
              console.warn(`[数据验证] 题目id过长(${normalized.id.length}>32): ${normalized.id}`);
              normalized.id = normalized.id.substring(normalized.id.length - 32);
            }
            // 确保 subjectId 正确
            normalized.subjectId = subjectId;
            questionsToInsert.push(normalized);
          } else {
            skippedCount++;
          }
        }

        if (skippedCount > 0) {
          console.warn(`[数据验证] ${skippedCount} 道题目因缺少必要字段被跳过`);
        }

        console.log(`[导入插入] 准备插入 ${questionsToInsert.length} 道题目（已验证）`);
        
        // 逐条插入以便捕获具体错误
        let successCount = 0;
        let failedCount = 0;
        for (const q of questionsToInsert) {
          try {
            await db.insert(questions).values(q);
            successCount++;
          } catch (insertError: any) {
            failedCount++;
            console.error(`[导入插入失败] 题目ID: ${q.id}, type: ${q.type}, 错误: ${insertError.message || insertError}`);
            console.error(`[导入插入失败详情] 题目数据:`, JSON.stringify(q).substring(0, 500));
          }
        }
        
        insertedCount = successCount;
        if (failedCount > 0) {
          console.warn(`[导入警告] ${failedCount} 道题目插入失败`);
        }
        console.log(`[导入插入成功] ${successCount} 道题目`);
      }

      if (questionsToUpdate && questionsToUpdate.length > 0) {
        console.log(`[导入更新] 准备更新 ${questionsToUpdate.length} 道题目`);
        let updateSuccessCount = 0;
        let updateFailedCount = 0;
        
        for (const q of questionsToUpdate) {
          const { id, createdAt, ...rest } = q;
          if (!id) {
            updateFailedCount++;
            console.warn(`[导入更新失败] 题目缺少id`);
            continue;
          }
          try {
            await db.update(questions)
              .set(rest)
              .where(eq(questions.id, id));
            updateSuccessCount++;
          } catch (updateError: any) {
            updateFailedCount++;
            console.error(`[导入更新失败] 题目ID: ${id}, 错误: ${updateError.message || updateError}`);
          }
        }
        updatedCount = updateSuccessCount;
        if (updateFailedCount > 0) {
          console.warn(`[导入警告] ${updateFailedCount} 道题目更新失败`);
        }
        console.log(`[导入更新成功] ${updateSuccessCount} 道题目`);
      }

      const countResult = await db.select({ count: count() }).from(questions).where(eq(questions.subjectId, subjectId));
      const totalCount = countResult[0].count || 0;
      
      await db.update(subjects)
        .set({ questionCount: totalCount })
        .where(eq(subjects.id, subjectId));

      console.log(`[导入完成] 新增: ${insertedCount}, 更新: ${updatedCount}, 题库总题数: ${totalCount}`);
      return { count: insertedCount + updatedCount, insertedCount, updatedCount };
    } catch (error: any) {
      console.error('[导入异常]', error);
      throw new Error(`导入失败: ${error.message || error}`);
    }
  }

  async deleteCustomSubject(userId: number, subjectId: string) {
    const subjectQuestions = await db.select({ id: questions.id }).from(questions).where(eq(questions.subjectId, subjectId));
    const questionIds = subjectQuestions.map(q => q.id);

    if (questionIds.length > 0) {
      await db.delete(answerRecords).where(inArray(answerRecords.questionId, questionIds));
      await db.delete(favoriteRecords).where(inArray(favoriteRecords.questionId, questionIds));
    }

    await db.delete(subjectStats).where(eq(subjectStats.subjectId, subjectId));
    await db.delete(questions).where(eq(questions.subjectId, subjectId));
    await db.delete(customSubjects).where(and(eq(customSubjects.id, subjectId), eq(customSubjects.userId, userId)));
    await db.delete(subjects).where(eq(subjects.id, subjectId));
    
    return { success: true };
  }
}