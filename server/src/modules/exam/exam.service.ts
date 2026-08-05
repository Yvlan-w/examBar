import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { questions, answerRecords, examSessions, sessionQuestions } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { StatsService } from '../stats/stats.service';
import { ExamSessionService } from '../exam-session/exam-session.service';

@Injectable()
export class ExamService {
  constructor(
    private readonly statsService: StatsService,
    private readonly examSessionService: ExamSessionService,
  ) {}

  private generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  async startExam(subjectId: string, duration: number, questionCount: number = 20, userId?: number) {
    const conditions: any[] = [];
    if (subjectId) conditions.push(eq(questions.subjectId, subjectId));

    const query = conditions.length > 0
      ? db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
          difficulty: questions.difficulty,
          subjectId: questions.subjectId,
          subjectName: questions.subjectName,
          answer: questions.answer,
          analysis: questions.analysis,
        }).from(questions).where(and(...conditions))
      : db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
          difficulty: questions.difficulty,
          subjectId: questions.subjectId,
          subjectName: questions.subjectName,
          answer: questions.answer,
          analysis: questions.analysis,
        }).from(questions);

    const examQuestions = await query;

    if (examQuestions.length === 0) {
      return {
        questions: [],
        totalQuestions: 0,
        duration,
        sessionId: null,
      };
    }

    const shuffled = [...examQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    const firstQuestion = selected[0];

    // 创建考试场次
    let sessionId: string | null = null;
    if (userId) {
      sessionId = this.generateSessionId();
      const now = new Date();
      try {
        await db.insert(examSessions).values({
          id: sessionId,
          userId: userId || null,
          mode: 'exam',
          subjectId: subjectId || firstQuestion.subjectId,
          subjectName: firstQuestion.subjectName,
          totalQuestions: selected.length,
          correctCount: 0,
          duration: 0,
          elapsedTime: 0,
          completed: false,
          createdAt: now,
        });
        
        // 写入关联记录
        const sqData = selected.map((q, index) => ({
          id: 'sq_' + sessionId! + '_' + index,
          sessionId: sessionId!,
          questionId: q.id,
          orderIndex: index,
          answered: false,
        }));
        await db.insert(sessionQuestions).values(sqData);
        
        console.log(`[Session] 模拟考试创建场次: ${sessionId}, 题目数: ${selected.length}`);
      } catch (sessionError) {
        console.warn('[Session] 模拟考试创建场次失败（不影响考试）:', sessionError.message);
        sessionId = null;
      }
    }

    const safeQuestions = selected.map(({ answer, analysis, ...rest }) => rest);

    return {
      questions: safeQuestions,
      totalQuestions: safeQuestions.length,
      duration,
      sessionId,
    };
  }

  async submitExam(
    subjectId: string,
    answers: { questionId: string; answer: string }[],
    timeUsed: number,
    userId?: number,
    sessionId?: string,
  ) {
    let correct = 0;
    const total = answers.length;
    const createdAt = new Date();

    for (const ans of answers) {
      const questionResult = await db.select().from(questions).where(eq(questions.id, ans.questionId)).limit(1);
      const question = questionResult[0];
      if (!question) continue;

      let isCorrect = false;
      if (question.type === 'multi') {
        // 多选题：使用数组比较
        isCorrect = this.compareMultiAnswers(ans.answer, question.answer);
      } else if (question.type === 'short') {
        // 简答题：暂不自动判题，记为错误
        isCorrect = false;
      } else {
        // 单选题、判断题：直接比较
        isCorrect = ans.answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
      }
      if (isCorrect) correct++;

      await db.insert(answerRecords).values({
        id: 'r' + Date.now() + Math.random().toString(36).substring(2, 6),
        sessionId: sessionId || null,
        questionId: ans.questionId,
        userId: userId || null,
        userAnswer: ans.answer,
        isCorrect,
        mode: 'exam',
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        createdAt,
      });

      if (userId) {
        await this.statsService.updateStats(userId, question.subjectId, isCorrect);
      }

      // 标记题目为已答
      if (sessionId) {
        await this.examSessionService.markQuestionAnswered(sessionId, ans.questionId);
      }
    }

    // 更新场次统计并标记完成
    if (sessionId) {
      try {
        // 获取场次信息以获取总题数
        const session = await this.examSessionService.getSessionById(sessionId);
        const totalQuestions = session?.totalQuestions || total;
        
        await db.update(examSessions).set({
          correctCount: correct,
          completed: true,
          completedAt: new Date(),
          duration: timeUsed,
          elapsedTime: timeUsed,
        }).where(eq(examSessions.id, sessionId));
        console.log(`[Session] 模拟考试完成场次: ${sessionId}, 正确: ${correct}/${totalQuestions}`);
      } catch (sessionError) {
        console.warn('[Session] 更新模拟考试场次失败:', sessionError.message);
      }
    }

    const totalQuestions = total > 0 ? total : 0;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    return {
      total: totalQuestions,
      correct,
      score,
      timeUsed,
    };
  }

  /**
   * 保存单题答案（实时保存进度）
   */
  async saveAnswer(sessionId: string, questionId: string, answer: string, userId?: number) {
    const questionResult = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
    const question = questionResult[0];
    if (!question) {
      return { success: false, error: '题目不存在' };
    }

    let isCorrect = false;
    if (question.type === 'multi') {
      isCorrect = this.compareMultiAnswers(answer, question.answer);
    } else if (question.type === 'short') {
      isCorrect = false;
    } else {
      isCorrect = answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
    }

    const createdAt = new Date();

    // 查找是否已有答题记录（更新而非重复插入）
    const existingRecord = await db.select().from(answerRecords)
      .where(and(
        eq(answerRecords.sessionId, sessionId),
        eq(answerRecords.questionId, questionId),
      ))
      .limit(1);

    if (existingRecord.length > 0) {
      // 更新已有记录
      await db.update(answerRecords)
        .set({
          userAnswer: answer,
          isCorrect,
        })
        .where(eq(answerRecords.id, existingRecord[0].id));
    } else {
      // 插入新记录
      await db.insert(answerRecords).values({
        id: 'r' + Date.now() + Math.random().toString(36).substring(2, 6),
        sessionId,
        questionId,
        userId: userId || null,
        userAnswer: answer,
        isCorrect,
        mode: 'exam',
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        createdAt,
      });
    }

    // 更新场次统计
    if (sessionId) {
      await this.examSessionService.markQuestionAnswered(sessionId, questionId);

      // 重新统计正确数量
      const allRecords = await db.select().from(answerRecords)
        .where(eq(answerRecords.sessionId, sessionId));
      const correctCount = allRecords.filter(r => r.isCorrect).length;

      await db.update(examSessions)
        .set({ correctCount })
        .where(eq(examSessions.id, sessionId));
    }

    return { success: true, isCorrect };
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
}
