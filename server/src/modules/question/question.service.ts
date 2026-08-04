import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { db } from '@/db/db.module';
import { questions, subjects, answerRecords, favoriteRecords, customSubjects, sessionQuestions, subjectStats } from '@/db/schema';
import { eq, and, count, desc, or, isNotNull, isNull, sql, inArray } from 'drizzle-orm';
import {
  subjects as seedSubjects,
  questions as seedQuestions,
} from '@/data/seed-data';
import { StatsService } from '../stats/stats.service';
import { AnswerEvaluateService } from '../answer-evaluate/answer-evaluate.service';
import { StorageService } from '../storage/storage.service';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface AnswerRecord {
  id: string;
  questionId: string;
  userId?: number;
  userAnswer: string;
  isCorrect: boolean;
  mode: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
}

@Injectable()
export class QuestionService implements OnModuleInit {
  private logger = new Logger(QuestionService.name);

  constructor(
    private readonly statsService: StatsService,
    private readonly answerEvaluateService: AnswerEvaluateService,
    private readonly storageService: StorageService,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    const seedSubjectIds = seedSubjects.map(s => s.id);

    // 检测并清除旧的预设题库数据（不在 customSubjects 表中的系统题库）
    const existingSystemSubjects = await db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .leftJoin(customSubjects, eq(subjects.id, customSubjects.id))
      .where(isNull(customSubjects.id));

    const staleSubjectIds = existingSystemSubjects
      .filter(s => seedSubjectIds.includes(s.id))
      .map(s => s.id);

    if (staleSubjectIds.length > 0) {
      console.log(`[Seed] 检测到 ${staleSubjectIds.length} 个旧预设题库，正在清除...`);
      // 先删除关联的答题记录和收藏记录
      const staleQuestionIds = await db
        .select({ id: questions.id })
        .from(questions)
        .where(inArray(questions.subjectId, staleSubjectIds));
      const qIds = staleQuestionIds.map(q => q.id);
      if (qIds.length > 0) {
        await db.delete(answerRecords).where(inArray(answerRecords.questionId, qIds));
        await db.delete(favoriteRecords).where(inArray(favoriteRecords.questionId, qIds));
        await db.delete(sessionQuestions).where(inArray(sessionQuestions.questionId, qIds));
      }
      await db.delete(questions).where(inArray(questions.subjectId, staleSubjectIds));
      await db.delete(subjectStats).where(inArray(subjectStats.subjectId, staleSubjectIds));
      await db.delete(subjects).where(inArray(subjects.id, staleSubjectIds));
      console.log(`[Seed] 旧预设题库已清除`);
    }

    // 插入预设科目（如果不存在）
    for (const subject of seedSubjects) {
      const exists = await db.select().from(subjects).where(eq(subjects.id, subject.id));
      if (exists.length === 0) {
        await db.insert(subjects).values(subject);
      }
    }
    console.log(`[Seed] 预设科目已就绪 (${seedSubjects.length} 个)`);

    // 检查预设题目是否需要插入
    const questionCount = await db.select({ count: count() })
      .from(questions)
      .where(inArray(questions.subjectId, seedSubjectIds));

    if (questionCount[0].count === 0) {
      console.log(`[Seed] 开始插入预设题目，共 ${seedQuestions.length} 题...`);
      const BATCH_SIZE = 200;
      let insertedCount = 0;
      for (let i = 0; i < seedQuestions.length; i += BATCH_SIZE) {
        const batch = seedQuestions.slice(i, i + BATCH_SIZE);
        try {
          await db.insert(questions).values(batch);
          insertedCount += batch.length;
          if (insertedCount % 1000 === 0 || insertedCount === seedQuestions.length) {
            console.log(`[Seed] 已插入 ${insertedCount}/${seedQuestions.length} 题`);
          }
        } catch (err) {
          console.error(`[Seed] 批次 ${i}-${i + BATCH_SIZE} 插入失败:`, err.message);
        }
      }
      console.log(`[Seed] 题目插入完成，共 ${insertedCount} 题`);

      // 上传题目图片到 TOS 并更新题目数据
      await this.uploadQuestionImages();
    } else {
      console.log(`[Seed] 预设题目已存在 (${questionCount[0].count} 题)，跳过插入`);
      
      // 检查是否需要上传图片（题目存在但图片可能未上传）
      await this.checkAndUploadImagesIfNeeded();
    }
  }

  /**
   * 上传题目中的图片到 TOS
   * 读取 image-mapping.json，上传所有图片，然后更新数据库中的题目
   * 
   * 图片类型：
   * - option: 选项图片，关联到具体选项（通过 optionLabel）或题干（optionLabel 为 null）
   * - analysis: 解析图片，追加到解析内容末尾
   */
  private async uploadQuestionImages(): Promise<void> {
    try {
      const dataDir = join(process.cwd(), 'src', 'data');
      const imageMappingPath = join(dataDir, 'image-mapping.json');
      let imageMapping: Record<string, any>;
      
      try {
        const mappingContent = await readFile(imageMappingPath, 'utf-8');
        imageMapping = JSON.parse(mappingContent);
      } catch (err) {
        this.logger.warn('[Seed] 未找到图片映射文件，跳过图片上传');
        return;
      }

      const questionIds = Object.keys(imageMapping);
      this.logger.log(`[Seed] 开始上传题目图片，共 ${questionIds.length} 道题目有图片`);

      for (const questionId of questionIds) {
        const mapping = imageMapping[questionId];
        const { images } = mapping;

        if (!images || images.length === 0) continue;

        // 分类存储上传后的 URL
        const optionImageUrls: Record<string, string> = {};  // 选项标签 -> URL
        const questionImageUrls: string[] = [];  // 题干图片 URL 列表
        const analysisImageUrls: string[] = [];  // 解析图片 URL 列表
        
        // 题目 ID 格式: s3_q163, 需要转换为数据库 ID 格式: question_s3_163
        const dbQuestionId = this.convertToDbQuestionId(questionId);
        if (!dbQuestionId) continue;

        for (const image of images) {
          try {
            this.logger.log(`[Seed] 上传图片: ${image.fileName} (${image.type})`);
            
            // 使用 relativePath 读取图片
            const imagePath = join(dataDir, image.relativePath);
            const imageBuffer = await readFile(imagePath);
            
            // 上传到 TOS
            const { url } = await this.storageService.uploadQuestionImage(
              imageBuffer,
              image.uploadKey,
              image.contentType
            );
            
            // 根据类型分类存储 URL
            if (image.type === 'option') {
              if (image.optionLabel) {
                optionImageUrls[image.optionLabel] = url;
              } else {
                questionImageUrls.push(url);
              }
            } else if (image.type === 'analysis') {
              analysisImageUrls.push(url);
            }
            
            this.logger.log(`[Seed] 图片上传成功: ${image.fileName} -> ${url}`);
          } catch (err) {
            this.logger.error(`[Seed] 图片上传失败 ${image.fileName}:`, err.message);
          }
        }

        // 更新题目数据
        if (Object.keys(optionImageUrls).length > 0 || 
            questionImageUrls.length > 0 || 
            analysisImageUrls.length > 0) {
          await this.updateQuestionWithImages(dbQuestionId, {
            optionImageUrls,
            questionImageUrls,
            analysisImageUrls,
          });
        }
      }

      this.logger.log(`[Seed] 题目图片上传完成`);
    } catch (error) {
      this.logger.error('[Seed] 图片上传流程出错:', error.message);
    }
  }

  /**
   * 将映射文件中的题目 ID 转换为数据库中的题目 ID
   * 映射文件格式: s3_q163 -> 数据库格式: question_s3_163
   */
  private convertToDbQuestionId(mappingId: string): string | null {
    // 匹配 s1_q123, s2_q456, s3_q789, s4_q012
    const match = mappingId.match(/^(s[1-4])_q(\d+)$/);
    if (!match) return null;
    
    const subjectCode = match[1];
    const num = match[2];
    
    return `question_${subjectCode}_${num}`;
  }

  /**
   * 更新数据库中的题目，添加图片 URL
   * 
   * 处理方式：
   * - 选项图片: 替换对应选项的内容为 Markdown 图片格式
   * - 题干图片: 在题干末尾追加 Markdown 图片
   * - 解析图片: 在解析内容末尾追加 Markdown 图片
   */
  private async updateQuestionWithImages(
    questionId: string, 
    imageUrls: {
      optionImageUrls: Record<string, string>;
      questionImageUrls: string[];
      analysisImageUrls: string[];
    }
  ): Promise<void> {
    try {
      const question = await db.select({
        content: questions.content,
        options: questions.options,
        analysis: questions.analysis,
      }).from(questions).where(eq(questions.id, questionId));

      if (question.length === 0) {
        this.logger.warn(`[Seed] 题目 ${questionId} 不存在`);
        return;
      }

      const currentQuestion = question[0];
      const updates: any = {};

      // 1. 更新题干（添加题干图片）
      if (imageUrls.questionImageUrls.length > 0) {
        const questionImagesMarkdown = imageUrls.questionImageUrls
          .map(url => `![题目图片](${url})`)
          .join('\n');
        updates.content = `${currentQuestion.content || ''}\n\n${questionImagesMarkdown}`;
      }

      // 2. 更新选项（添加选项图片）
      if (Object.keys(imageUrls.optionImageUrls).length > 0) {
        const currentOptions = (currentQuestion.options || []) as any[];
        const updatedOptions = currentOptions.map(opt => {
          const url = imageUrls.optionImageUrls[opt.label];
          if (url) {
            return {
              ...opt,
              content: `![${opt.label}选项](${url})`,
            };
          }
          return opt;
        });
        updates.options = updatedOptions;
      }

      // 3. 更新解析（添加解析图片）
      if (imageUrls.analysisImageUrls.length > 0) {
        const analysisImagesMarkdown = imageUrls.analysisImageUrls
          .map(url => `![解析图片](${url})`)
          .join('\n');
        updates.analysis = `${currentQuestion.analysis || ''}\n\n${analysisImagesMarkdown}`;
      }

      // 执行更新
      if (Object.keys(updates).length > 0) {
        await db.update(questions)
          .set(updates)
          .where(eq(questions.id, questionId));
        
        this.logger.log(`[Seed] 题目 ${questionId} 已更新: ${Object.keys(updates).join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`[Seed] 更新题目 ${questionId} 失败:`, error.message);
    }
  }

  /**
   * 检查并上传未完成的图片（题目已存在但图片未上传的情况）
   */
  private async checkAndUploadImagesIfNeeded(): Promise<void> {
    try {
      const imageMappingPath = join(process.cwd(), 'src', 'data', 'image-mapping.json');
      let imageMapping: Record<string, any>;
      
      try {
        const mappingContent = await readFile(imageMappingPath, 'utf-8');
        imageMapping = JSON.parse(mappingContent);
      } catch {
        return;
      }

      // 检查哪些题目的图片仍然未上传
      const questionIds = Object.keys(imageMapping);
      let needsUpload = false;

      for (const mappingId of questionIds) {
        const mapping = imageMapping[mappingId];
        const dbQuestionId = this.convertToDbQuestionId(mappingId);
        if (!dbQuestionId) continue;

        const question = await db.select({
          content: questions.content,
          options: questions.options,
          analysis: questions.analysis,
        }).from(questions).where(eq(questions.id, dbQuestionId));

        if (question.length > 0) {
          const q = question[0];
          const hasImages = mapping.hasOptionImages || mapping.hasAnalysisImages;
          
          if (!hasImages) continue;
          
          // 检查是否有选项图片但未更新
          if (mapping.hasOptionImages) {
            const options = (q.options || []) as any[];
            const hasOptionImages = options.some(opt => 
              opt.content && opt.content.includes('!['));
            if (!hasOptionImages) {
              needsUpload = true;
              break;
            }
          }
          
          // 检查是否有解析图片但未更新
          if (mapping.hasAnalysisImages) {
            const hasAnalysisImages = q.analysis && q.analysis.includes('![');
            if (!hasAnalysisImages) {
              needsUpload = true;
              break;
            }
          }
        }
      }

      if (needsUpload) {
        this.logger.log('[Seed] 检测到有题目图片未上传，开始上传...');
        await this.uploadQuestionImages();
      } else {
        this.logger.log('[Seed] 所有题目图片已就绪');
      }
    } catch (error) {
      this.logger.error('[Seed] 检查图片状态失败:', error.message);
    }
  }

  async getSubjects(userId?: number) {
    // 系统题库（不在 customSubjects 表中）对所有用户可见
    // 自定义题库：仅 isPublic=true 或 userId 匹配的可见
    const result = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        icon: subjects.icon,
        questionCount: subjects.questionCount,
        color: subjects.color,
        createdAt: subjects.createdAt,
      })
      .from(subjects)
      .leftJoin(customSubjects, eq(subjects.id, customSubjects.id))
      .where(
        or(
          isNull(customSubjects.id),        // 系统题库
          eq(customSubjects.isPublic, true),  // 公开自定义题库
          userId ? eq(customSubjects.userId, userId) : sql`false` // 用户自己创建的
        )
      );

    return result;
  }

  async getQuestions(filterSubjectId?: string, type?: string, difficulty?: string) {
    const conditions: any[] = [];
    if (filterSubjectId) conditions.push(eq(questions.subjectId, filterSubjectId));
    if (type && type !== 'all') conditions.push(eq(questions.type, type));
    if (difficulty && difficulty !== 'all') conditions.push(eq(questions.difficulty, difficulty));

    const query = conditions.length > 0
      ? db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
          answer: questions.answer,
          analysis: questions.analysis,
          difficulty: questions.difficulty,
          subjectId: questions.subjectId,
          subjectName: questions.subjectName,
          year: questions.year,
        }).from(questions).where(and(...conditions))
      : db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
          answer: questions.answer,
          analysis: questions.analysis,
          difficulty: questions.difficulty,
          subjectId: questions.subjectId,
          subjectName: questions.subjectName,
          year: questions.year,
        }).from(questions);

    return await query;
  }

  async getQuestionById(id: string) {
    const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    return result[0];
  }

  async getDailyQuestion() {
    const today = new Date();
    const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate());
    
    const countResult = await db.select({ count: count() }).from(questions);
    const total = countResult[0].count || 1;
    const randomIndex = dayIndex % total;

    const result = await db.select({
      id: questions.id,
      content: questions.content,
      type: questions.type,
      options: questions.options,
      answer: questions.answer,
      analysis: questions.analysis,
      difficulty: questions.difficulty,
      subjectId: questions.subjectId,
      subjectName: questions.subjectName,
      year: questions.year,
    }).from(questions).offset(randomIndex).limit(1);

    return result[0];
  }

  async submitAnswer(questionId: string, answer: string, mode: string, userId?: number, sessionId?: string) {
    const question = await this.getQuestionById(questionId);
    if (!question) return null;

    let isCorrect = false;
    let aiAnalysis = '';
    let score = 0;

    if (question.type === 'short') {
      // 简答题：AI 判题
      const evaluation = await this.answerEvaluateService.evaluateShortAnswer(
        question.content,
        answer,
        question.answer,
      );
      aiAnalysis = evaluation.aiAnalysis;
      score = evaluation.score;
      isCorrect = score >= 60;
    } else if (question.type === 'multi') {
      // 多选题：将答案拆分为数组并排序比较
      isCorrect = this.compareMultiAnswers(answer, question.answer);
    } else {
      // 单选题、判断题：直接比较
      isCorrect = answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
    }

    const recordId = 'r' + Date.now() + Math.random().toString(36).substring(2, 6);
    const createdAt = new Date();

    await db.insert(answerRecords).values({
      id: recordId,
      sessionId: sessionId || null,
      questionId,
      userId: userId || null,
      userAnswer: answer,
      isCorrect,
      mode,
      subjectId: question.subjectId,
      subjectName: question.subjectName,
      createdAt,
    });

    if (userId) {
      await this.statsService.updateStats(userId, question.subjectId, isCorrect);
    }

    if (sessionId) {
      // 更新 session 统计 + 标记题目已答
      try {
        const { ExamSessionService } = await import('../exam-session/exam-session.service');
        const sessionService = new ExamSessionService();
        await sessionService.updateSession(sessionId, {
          incrementCorrect: isCorrect,
        });
        await sessionService.markQuestionAnswered(sessionId, questionId);
      } catch (sessionError) {
        console.warn('[Session] 更新场次统计失败:', sessionError.message);
      }
    }

    return {
      isCorrect,
      correctAnswer: question.answer,
      analysis: question.analysis || '',
      aiAnalysis,
      score,
      record: {
        id: recordId,
        questionId,
        userId,
        sessionId,
        userAnswer: answer,
        isCorrect,
        mode,
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        createdAt,
      },
    };
  }

  /**
   * 比较多选题答案
   * 将答案拆分为数组，排序后比较
   * 支持多种格式：A,B,C 或 A B C 或 ["A","B","C"]
   */
  private compareMultiAnswers(userAnswer: string, correctAnswer: string): boolean {
    const parseAnswer = (ans: string): string[] => {
      // 移除方括号和引号（如果存在）
      let cleaned = ans.replace(/[\[\]"']/g, '');
      // 尝试用逗号分隔
      let parts = cleaned.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      // 如果逗号分隔后只有一个元素，尝试用空格分隔
      if (parts.length <= 1 && cleaned.includes(' ')) {
        parts = cleaned.split(/\s+/).map(s => s.trim().toUpperCase()).filter(Boolean);
      }
      return parts.sort();
    };

    const userParts = parseAnswer(userAnswer);
    const correctParts = parseAnswer(correctAnswer);

    console.log('[MultiAnswer] 用户答案:', userAnswer, '->', userParts);
    console.log('[MultiAnswer] 正确答案:', correctAnswer, '->', correctParts);
    console.log('[MultiAnswer] 比较结果:', JSON.stringify(userParts) === JSON.stringify(correctParts));

    return JSON.stringify(userParts) === JSON.stringify(correctParts);
  }

  async getAnswerRecords(userId?: number) {
    if (userId) {
      return await db.select().from(answerRecords).where(eq(answerRecords.userId, userId));
    }
    return await db.select().from(answerRecords);
  }

  async getHistoryQuestions(subjectId?: string, year?: string) {
    console.log(`[History] 查询真题 subjectId=${subjectId} year=${year}`);
    
    // 先查询所有题目，看看有没有带 year 的
    const allQuestions = await db.select({ id: questions.id, year: questions.year, subjectId: questions.subjectId, content: questions.content }).from(questions).limit(5);
    console.log(`[History] 数据库中前5条题目样本:`, allQuestions.map(q => ({ id: q.id, year: q.year, subjectId: q.subjectId, content: (q.content || '').substring(0, 30) })));
    
    const conditions: any[] = [];
    if (subjectId) conditions.push(eq(questions.subjectId, subjectId));
    if (year && year !== 'all') conditions.push(eq(questions.year, parseInt(year)));

    console.log(`[History] 查询条件数量: ${conditions.length}, conditions:`, conditions.map(c => String(c)));

    const query = conditions.length > 0
      ? db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
          answer: questions.answer,
          analysis: questions.analysis,
          difficulty: questions.difficulty,
          subjectId: questions.subjectId,
          subjectName: questions.subjectName,
          year: questions.year,
        }).from(questions).where(and(...conditions))
      : db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
          answer: questions.answer,
          analysis: questions.analysis,
          difficulty: questions.difficulty,
          subjectId: questions.subjectId,
          subjectName: questions.subjectName,
          year: questions.year,
        }).from(questions);

    const result = await query;
    console.log(`[History] 查询结果: ${result.length} 道题目`);
    if (result.length > 0) {
      console.log(`[History] 第一条样本:`, { id: result[0].id, year: result[0].year, subjectId: result[0].subjectId, content: (result[0].content || '').substring(0, 50) });
    }
    return result;
  }

  async getYears() {
    console.log('[Years] 查询所有可用年份');
    
    // 先检查数据库中 year 字段的分布
    const yearDistribution = await db.select({ 
      year: questions.year,
      count: sql<number>`count(*)` 
    }).from(questions).groupBy(questions.year);
    console.log('[Years] 数据库中 year 字段分布:', yearDistribution);
    
    const result = await db.select({ year: questions.year }).from(questions).where(isNotNull(questions.year)).groupBy(questions.year).orderBy(desc(questions.year));
    console.log(`[Years] 查询结果: ${result.length} 个年份, values:`, result);
    
    return result.map((r) => r.year!);
  }

  async toggleFavorite(questionId: string, userId?: number) {
    const existing = userId
      ? await db.select().from(favoriteRecords).where(and(eq(favoriteRecords.questionId, questionId), eq(favoriteRecords.userId, userId))).limit(1)
      : await db.select().from(favoriteRecords).where(eq(favoriteRecords.questionId, questionId)).limit(1);

    if (existing.length > 0) {
      if (userId) {
        await db.delete(favoriteRecords).where(and(eq(favoriteRecords.questionId, questionId), eq(favoriteRecords.userId, userId)));
      } else {
        await db.delete(favoriteRecords).where(eq(favoriteRecords.questionId, questionId));
      }
      return { isFavorite: false };
    } else {
      await db.insert(favoriteRecords).values({
        id: 'f' + Date.now() + Math.random().toString(36).substring(2, 6),
        userId: userId || null,
        questionId,
      });
      return { isFavorite: true };
    }
  }

  async isFavorite(questionId: string, userId?: number) {
    const result = userId
      ? await db.select().from(favoriteRecords).where(and(eq(favoriteRecords.questionId, questionId), eq(favoriteRecords.userId, userId))).limit(1)
      : await db.select().from(favoriteRecords).where(eq(favoriteRecords.questionId, questionId)).limit(1);
    return result.length > 0;
  }

  async getFavoriteQuestions(userId?: number) {
    const favorites = userId
      ? await db.select({ questionId: favoriteRecords.questionId }).from(favoriteRecords).where(eq(favoriteRecords.userId, userId))
      : await db.select({ questionId: favoriteRecords.questionId }).from(favoriteRecords);
    const favoriteIds = favorites.map((f) => f.questionId);

    if (favoriteIds.length === 0) return [];

    return await db.select({
      id: questions.id,
      content: questions.content,
      type: questions.type,
      options: questions.options,
      difficulty: questions.difficulty,
      subjectId: questions.subjectId,
      subjectName: questions.subjectName,
      year: questions.year,
    }).from(questions).where(or(...favoriteIds.map((id) => eq(questions.id, id))));
  }

  async getWrongQuestions(userId?: number, subjectId?: string) {
    let wrongRecords: any[];
    if (userId && subjectId) {
      wrongRecords = await db.select({ questionId: answerRecords.questionId }).from(answerRecords).where(and(eq(answerRecords.isCorrect, false), eq(answerRecords.userId, userId), eq(answerRecords.subjectId, subjectId)));
    } else if (userId) {
      wrongRecords = await db.select({ questionId: answerRecords.questionId }).from(answerRecords).where(and(eq(answerRecords.isCorrect, false), eq(answerRecords.userId, userId)));
    } else if (subjectId) {
      wrongRecords = await db.select({ questionId: answerRecords.questionId }).from(answerRecords).where(and(eq(answerRecords.isCorrect, false), eq(answerRecords.subjectId, subjectId)));
    } else {
      wrongRecords = await db.select({ questionId: answerRecords.questionId }).from(answerRecords).where(eq(answerRecords.isCorrect, false));
    }

    const wrongIds = [...new Set(wrongRecords.map((r) => r.questionId))];

    if (wrongIds.length === 0) return [];

    return await db.select({
      id: questions.id,
      content: questions.content,
      type: questions.type,
      options: questions.options,
      difficulty: questions.difficulty,
      subjectId: questions.subjectId,
      subjectName: questions.subjectName,
      year: questions.year,
    }).from(questions).where(or(...wrongIds.map((id) => eq(questions.id, id))));
  }
}