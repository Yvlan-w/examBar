import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { answerRecords, subjects, questions } from '@/db/schema';
import { eq, count, desc, and, or } from 'drizzle-orm';

@Injectable()
export class StatsService {
  async getOverview(userId?: number) {
    const today = new Date().toISOString().split('T')[0];
    
    const conditions: any[] = [];
    if (userId) conditions.push(eq(answerRecords.userId, userId));
    conditions.push(eq(answerRecords.createdAt, today));
    
    const todayResult = await db.select({ count: count() }).from(answerRecords).where(and(...conditions));
    const todayCount = todayResult[0].count || 0;

    const dateConditions = userId ? [eq(answerRecords.userId, userId)] : [];
    const dateResult = await db.select({ createdAt: answerRecords.createdAt }).from(answerRecords).where(and(...dateConditions));
    const uniqueDays = [...new Set(dateResult.map((r) => r.createdAt))].sort().reverse();
    
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (uniqueDays[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    const totalDays = uniqueDays.length;

    return {
      todayCount,
      totalDays,
      streak,
    };
  }

  async getDetail(userId?: number) {
    const conditions = userId ? [eq(answerRecords.userId, userId)] : [];
    
    const totalResult = await db.select({ count: count() }).from(answerRecords).where(and(...conditions));
    const totalQuestions = totalResult[0].count || 0;
    
    const correctConditions = [...conditions, eq(answerRecords.isCorrect, true)];
    const correctResult = await db.select({ count: count() }).from(answerRecords).where(and(...correctConditions));
    const totalCorrect = correctResult[0].count || 0;
    
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const todayConditions = [...conditions, eq(answerRecords.createdAt, today)];
    const todayResult = await db.select({ count: count() }).from(answerRecords).where(and(...todayConditions));
    const todayCount = todayResult[0].count || 0;

    const dateResult = await db.select({ createdAt: answerRecords.createdAt }).from(answerRecords).where(and(...conditions));
    const uniqueDays = [...new Set(dateResult.map((r) => r.createdAt))].sort().reverse();
    
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (uniqueDays[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    const totalDays = uniqueDays.length;

    const subjectList = await db.select().from(subjects);
    const subjectStats: Array<{
      subjectId: string;
      subjectName: string;
      total: number;
      correct: number;
      accuracy: number;
    }> = [];
    for (const s of subjectList) {
      const subjectConditions = [...conditions, eq(answerRecords.subjectId, s.id)];
      const subjectResult = await db.select({ count: count() }).from(answerRecords).where(and(...subjectConditions));
      const subjectTotal = subjectResult[0].count || 0;
      
      if (subjectTotal > 0) {
        const subjectCorrectConditions = [...conditions, eq(answerRecords.subjectId, s.id), eq(answerRecords.isCorrect, true)];
        const subjectCorrectResult = await db.select({ count: count() }).from(answerRecords).where(and(...subjectCorrectConditions));
        const subjectCorrect = subjectCorrectResult[0].count || 0;
        
        subjectStats.push({
          subjectId: s.id,
          subjectName: s.name,
          total: subjectTotal,
          correct: subjectCorrect,
          accuracy: Math.round((subjectCorrect / subjectTotal) * 100),
        });
      }
    }

    const recentRecords = await db.select({
      id: answerRecords.id,
      subjectName: answerRecords.subjectName,
      mode: answerRecords.mode,
      isCorrect: answerRecords.isCorrect,
      createdAt: answerRecords.createdAt,
    }).from(answerRecords).where(and(...conditions)).orderBy(desc(answerRecords.createdAt)).limit(10);

    return {
      totalQuestions,
      totalCorrect,
      accuracy,
      todayCount,
      streak,
      totalDays,
      subjectStats,
      recentRecords: recentRecords.map((r) => ({
        id: r.id,
        subjectName: r.subjectName,
        mode: r.mode,
        total: 1,
        correct: r.isCorrect ? 1 : 0,
        accuracy: r.isCorrect ? 100 : 0,
        createdAt: r.createdAt,
      })),
    };
  }

  async getWrongQuestions(subjectId?: string, userId?: number) {
    const conditions: any[] = [eq(answerRecords.isCorrect, false)];
    if (userId) conditions.push(eq(answerRecords.userId, userId));
    
    const wrongResult = await db.select({ questionId: answerRecords.questionId }).from(answerRecords).where(and(...conditions));
    const wrongQuestionIds = [...new Set(wrongResult.map((r) => r.questionId))];
    
    if (wrongQuestionIds.length === 0) return [];
    
    const questionConditions: any[] = wrongQuestionIds.map((id) => eq(questions.id, id));
    if (subjectId) questionConditions.push(eq(questions.subjectId, subjectId));
    
    const result = await db.select({
      id: questions.id,
      content: questions.content,
      type: questions.type,
      options: questions.options,
      difficulty: questions.difficulty,
      subjectId: questions.subjectId,
      subjectName: questions.subjectName,
    }).from(questions).where(or(...questionConditions));
    
    return result;
  }
}
