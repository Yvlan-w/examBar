import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { examSessions, answerRecords, sessionQuestions, questions } from '@/db/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';

@Injectable()
export class ExamSessionService {
  async createSession(params: {
    userId?: number;
    mode: string;
    subjectId?: string;
    subjectName?: string;
    totalQuestions?: number;
    questionIds?: string[];
  }) {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    
    const session = await db.insert(examSessions).values({
      id: sessionId,
      userId: params.userId || null,
      mode: params.mode,
      subjectId: params.subjectId || null,
      subjectName: params.subjectName || null,
      totalQuestions: params.totalQuestions || 0,
      correctCount: 0,
      duration: 0,
      completed: false,
    }).returning();
    
    // 写入关联记录
    if (params.questionIds && params.questionIds.length > 0) {
      const sessionQuestionsData = params.questionIds.map((qId, index) => ({
        id: 'sq_' + sessionId + '_' + index,
        sessionId,
        questionId: qId,
        orderIndex: index,
        answered: false,
      }));
      await db.insert(sessionQuestions).values(sessionQuestionsData);
      console.log(`[Session] 写入 ${sessionQuestionsData.length} 条关联记录`);
    }
    
    console.log(`[Session] 创建场次: ${sessionId}, mode=${params.mode}, subject=${params.subjectName}`);
    return session[0];
  }

  async updateSession(sessionId: string, params: {
    incrementCorrect?: boolean;
    addDuration?: number;
    addElapsedTime?: number;
  }) {
    const updates: any = {};
    
    if (params.incrementCorrect) {
      updates.correctCount = sql`${examSessions.correctCount} + 1`;
    }
    if (params.addDuration) {
      updates.duration = sql`${examSessions.duration} + ${params.addDuration}`;
    }
    if (params.addElapsedTime) {
      updates.elapsedTime = sql`${examSessions.elapsedTime} + ${params.addElapsedTime}`;
    }
    
    if (Object.keys(updates).length > 0) {
      await db.update(examSessions).set(updates).where(eq(examSessions.id, sessionId));
    }
  }

  async completeSession(sessionId: string) {
    // 获取当前场次信息
    const session = await this.getSessionById(sessionId);
    if (!session) return;
    
    // 计算已用时间
    const now = new Date();
    const createdAt = session.createdAt ? new Date(session.createdAt) : now;
    const elapsedSeconds = Math.round((now.getTime() - createdAt.getTime()) / 1000);
    const totalElapsed = (session.elapsedTime || 0) + elapsedSeconds;
    
    await db.update(examSessions).set({
      completed: true,
      completedAt: now,
      elapsedTime: totalElapsed,
    }).where(eq(examSessions.id, sessionId));
    
    console.log(`[Session] 完成场次: ${sessionId}, 用时: ${totalElapsed}秒`);
  }

  async markQuestionAnswered(sessionId: string, questionId: string) {
    await db.update(sessionQuestions).set({ answered: true })
      .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.questionId, questionId)));
  }

  async getRecentSessions(userId?: number, limit: number = 10) {
    const query = userId 
      ? db.select().from(examSessions).where(eq(examSessions.userId, userId)).orderBy(desc(examSessions.createdAt)).limit(limit)
      : db.select().from(examSessions).orderBy(desc(examSessions.createdAt)).limit(limit);
    
    const sessions = await query;
    console.log(`[Session] 获取最近场次: ${sessions.length} 条`);
    return sessions;
  }

  async getSessionById(sessionId: string) {
    const sessions = await db.select().from(examSessions).where(eq(examSessions.id, sessionId)).limit(1);
    return sessions[0] || null;
  }

  /**
   * 获取场次详情（含逐题回顾）
   */
  async getSessionDetail(sessionId: string) {
    const session = await this.getSessionById(sessionId);
    if (!session) return null;

    // 获取关联的题目ID列表（按顺序）
    const sqRecords = await db.select().from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, sessionId))
      .orderBy(sessionQuestions.orderIndex);
    
    const questionIds = sqRecords.map(sq => sq.questionId);

    // 获取题目详情
    const questionDetails = questionIds.length > 0
      ? await db.select().from(questions).where(inArray(questions.id, questionIds))
      : [];
    
    // 获取答题记录
    const answerRecordsList = await db.select().from(answerRecords)
      .where(eq(answerRecords.sessionId, sessionId));
    
    // 构建逐题回顾
    const questionReviews = sqRecords.map(sq => {
      const question = questionDetails.find(q => q.id === sq.questionId);
      const answer = answerRecordsList.find(a => a.questionId === sq.questionId);
      return {
        orderIndex: sq.orderIndex,
        questionId: sq.questionId,
        answered: sq.answered,
        question: question ? {
          id: question.id,
          content: question.content,
          type: question.type,
          options: question.options,
          answer: question.answer,
          analysis: question.analysis,
          difficulty: question.difficulty,
        } : null,
        userAnswer: answer?.userAnswer || null,
        isCorrect: answer?.isCorrect || false,
        answeredAt: answer?.createdAt || null,
      };
    });

    // 按题型统计正确率
    const typeStats: Record<string, { total: number; correct: number }> = {};
    questionReviews.forEach(review => {
      if (review.question) {
        const type = review.question.type;
        if (!typeStats[type]) typeStats[type] = { total: 0, correct: 0 };
        typeStats[type].total++;
        if (review.isCorrect) typeStats[type].correct++;
      }
    });

    // 计算实际用时（秒）
    let actualDuration = 0;
    if (session.completed && session.completedAt && session.createdAt) {
      // 已完成：用完成时间 - 创建时间
      actualDuration = Math.round((new Date(session.completedAt).getTime() - new Date(session.createdAt).getTime()) / 1000);
    } else if (session.elapsedTime) {
      // 进行中：使用已用时间
      actualDuration = session.elapsedTime;
    } else if (session.duration) {
      // 回退：使用 duration 字段
      actualDuration = session.duration;
    }

    return {
      session: {
        id: session.id,
        mode: session.mode,
        subjectName: session.subjectName,
        totalQuestions: session.totalQuestions,
        correctCount: session.correctCount,
        completed: session.completed,
        createdAt: session.createdAt,
        completedAt: session.completedAt,
        duration: actualDuration,
      },
      questionReviews,
      typeStats,
    };
  }

  /**
   * 获取场次完整题目列表（含已答状态和用户答案）
   * 用于恢复进度
   */
  async getSessionQuestions(sessionId: string) {
    const session = await this.getSessionById(sessionId);
    if (!session) return null;

    // 获取全部关联记录（按顺序）
    const sqRecords = await db.select().from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, sessionId))
      .orderBy(sessionQuestions.orderIndex);
    
    if (sqRecords.length === 0) {
      return { session, questions: [], nextIndex: 0 };
    }

    const questionIds = sqRecords.map(sq => sq.questionId);

    // 获取题目详情
    const questionDetails = await db.select().from(questions)
      .where(inArray(questions.id, questionIds));
    
    // 获取答题记录
    const answerRecordsList = await db.select().from(answerRecords)
      .where(eq(answerRecords.sessionId, sessionId));

    // 构建完整题目列表，包含答题状态
    const orderedQuestions = sqRecords.map(sq => {
      const question = questionDetails.find(q => q.id === sq.questionId);
      const answer = answerRecordsList.find(a => a.questionId === sq.questionId);
      return question ? {
        id: question.id,
        content: question.content,
        type: question.type,
        options: question.options,
        answer: question.answer,
        analysis: question.analysis,
        difficulty: question.difficulty,
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        orderIndex: sq.orderIndex,
        answered: sq.answered,
        userAnswer: answer?.userAnswer || null,
        isCorrect: answer?.isCorrect || false,
      } : null;
    }).filter(q => q !== null);

    // 找到第一个未答题目的索引
    const nextIndex = sqRecords.findIndex(sq => !sq.answered);

    return { 
      session, 
      questions: orderedQuestions, 
      nextIndex: nextIndex === -1 ? 0 : nextIndex 
    };
  }

  /**
   * 获取未完成场次的待答题目列表（旧接口，保留兼容）
   */
  async getRemainingQuestions(sessionId: string) {
    const session = await this.getSessionById(sessionId);
    if (!session) return null;

    // 获取未答的关联记录
    const sqRecords = await db.select().from(sessionQuestions)
      .where(and(eq(sessionQuestions.sessionId, sessionId), eq(sessionQuestions.answered, false)))
      .orderBy(sessionQuestions.orderIndex);
    
    if (sqRecords.length === 0) {
      return { session, questions: [] };
    }

    const questionIds = sqRecords.map(sq => sq.questionId);

    // 获取题目详情
    const questionDetails = await db.select().from(questions)
      .where(inArray(questions.id, questionIds));

    // 按 orderIndex 排序
    const orderedQuestions = sqRecords.map(sq => {
      const question = questionDetails.find(q => q.id === sq.questionId);
      return question ? {
        id: question.id,
        content: question.content,
        type: question.type,
        options: question.options,
        answer: question.answer,
        analysis: question.analysis,
        difficulty: question.difficulty,
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        orderIndex: sq.orderIndex,
      } : null;
    }).filter(q => q !== null);

    return { session, questions: orderedQuestions };
  }

  async getSessionsBySubject(userId?: number, subjectId?: string, limit: number = 10) {
    const conditions: any[] = [];
    if (userId) conditions.push(eq(examSessions.userId, userId));
    if (subjectId) conditions.push(eq(examSessions.subjectId, subjectId));
    
    const query = conditions.length > 0
      ? db.select().from(examSessions).where(and(...conditions)).orderBy(desc(examSessions.createdAt)).limit(limit)
      : db.select().from(examSessions).orderBy(desc(examSessions.createdAt)).limit(limit);
    
    return await query;
  }
}
