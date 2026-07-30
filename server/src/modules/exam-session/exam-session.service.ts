import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { examSessions, answerRecords } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

@Injectable()
export class ExamSessionService {
  async createSession(params: {
    userId?: number;
    mode: string;
    subjectId?: string;
    subjectName?: string;
    totalQuestions?: number;
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
    
    console.log(`[Session] 创建场次: ${sessionId}, mode=${params.mode}, subject=${params.subjectName}`);
    return session[0];
  }

  async updateSession(sessionId: string, params: {
    incrementCorrect?: boolean;
    incrementTotal?: boolean;
    addDuration?: number;
  }) {
    const updates: any = {};
    
    if (params.incrementCorrect) {
      updates.correctCount = sql`${examSessions.correctCount} + 1`;
    }
    if (params.incrementTotal) {
      updates.totalQuestions = sql`${examSessions.totalQuestions} + 1`;
    }
    if (params.addDuration) {
      updates.duration = sql`${examSessions.duration} + ${params.addDuration}`;
    }
    
    if (Object.keys(updates).length > 0) {
      await db.update(examSessions).set(updates).where(eq(examSessions.id, sessionId));
    }
  }

  async completeSession(sessionId: string) {
    await db.update(examSessions).set({
      completed: true,
      completedAt: new Date(),
    }).where(eq(examSessions.id, sessionId));
    
    console.log(`[Session] 完成场次: ${sessionId}`);
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
