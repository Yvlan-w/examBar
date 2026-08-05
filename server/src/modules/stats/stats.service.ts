import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { answerRecords, subjects, questions, userStats, subjectStats, examSessions, sessionQuestions } from '@/db/schema';
import { eq, count, desc, and, or, sql, inArray } from 'drizzle-orm';

@Injectable()
export class StatsService {
  
  /**
   * 格式化时间为东八区（Asia/Shanghai）字符串
   */
  private formatToShanghaiTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Shanghai',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('zh-CN', options).format(d);
  }
  async updateStats(userId: number, subjectId: string, isCorrect: boolean) {
    const today = new Date().toISOString().split('T')[0];

    const existingUserStats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
    
    if (existingUserStats.length === 0) {
      await db.insert(userStats).values({
        userId,
        todayCount: 1,
        totalQuestions: 1,
        totalCorrect: isCorrect ? 1 : 0,
        streak: 1,
        totalDays: 1,
        lastStudyDate: today,
      });
    } else {
      const current = existingUserStats[0];
      const isNewDay = current.lastStudyDate !== today;
      
      let newTodayCount = (current.todayCount || 0) + 1;
      let newTotalDays = current.totalDays || 0;
      let newStreak = current.streak || 0;
      
      if (isNewDay) {
        newTodayCount = 1;
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (current.lastStudyDate === yesterdayStr) {
          newStreak = (current.streak || 0) + 1;
        } else {
          newStreak = 1;
        }
        
        newTotalDays = (current.totalDays || 0) + 1;
      }
      
      await db.update(userStats)
        .set({
          todayCount: newTodayCount,
          totalQuestions: (current.totalQuestions || 0) + 1,
          totalCorrect: (current.totalCorrect || 0) + (isCorrect ? 1 : 0),
          streak: newStreak,
          totalDays: newTotalDays,
          lastStudyDate: today,
        })
        .where(eq(userStats.userId, userId));
    }

    const existingSubjectStats = await db.select()
      .from(subjectStats)
      .where(and(eq(subjectStats.userId, userId), eq(subjectStats.subjectId, subjectId)))
      .limit(1);
    
    if (existingSubjectStats.length === 0) {
      await db.insert(subjectStats).values({
        userId,
        subjectId,
        total: 1,
        correct: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
      });
    } else {
      const current = existingSubjectStats[0];
      const newTotal = (current.total || 0) + 1;
      const newCorrect = (current.correct || 0) + (isCorrect ? 1 : 0);
      const newAccuracy = Math.round((newCorrect / newTotal) * 100);
      
      await db.update(subjectStats)
        .set({
          total: newTotal,
          correct: newCorrect,
          accuracy: newAccuracy,
        })
        .where(and(eq(subjectStats.userId, userId), eq(subjectStats.subjectId, subjectId)));
    }
  }

  async getOverview(userId?: number) {
    if (!userId) {
      return {
        todayCount: 0,
        totalDays: 0,
        streak: 0,
      };
    }

    const result = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
    
    if (result.length === 0) {
      return {
        todayCount: 0,
        totalDays: 0,
        streak: 0,
      };
    }

    const stats = result[0];
    const today = new Date().toISOString().split('T')[0];
    const isToday = stats.lastStudyDate === today;
    
    return {
      todayCount: isToday ? (stats.todayCount || 0) : 0,
      totalDays: stats.totalDays || 0,
      streak: stats.streak || 0,
    };
  }

  async getDetail(userId?: number) {
    if (!userId) {
      return {
        totalQuestions: 0,
        totalCorrect: 0,
        accuracy: 0,
        todayCount: 0,
        streak: 0,
        totalDays: 0,
        subjectStats: [],
        recentRecords: [],
      };
    }

    const userResult = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
    
    let totalQuestions = 0;
    let totalCorrect = 0;
    let accuracy = 0;
    let todayCount = 0;
    let streak = 0;
    let totalDays = 0;
    
    if (userResult.length > 0) {
      const stats = userResult[0];
      totalQuestions = stats.totalQuestions || 0;
      totalCorrect = stats.totalCorrect || 0;
      accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const today = new Date().toISOString().split('T')[0];
      todayCount = stats.lastStudyDate === today ? (stats.todayCount || 0) : 0;
      streak = stats.streak || 0;
      totalDays = stats.totalDays || 0;
    }

    const subjectList = await db.select().from(subjects);
    const userSubjectStats = await db.select().from(subjectStats).where(eq(subjectStats.userId, userId));
    
    const subjectStatsMap = new Map<string, typeof userSubjectStats[0]>();
    for (const stats of userSubjectStats) {
      if (stats.subjectId) {
        subjectStatsMap.set(stats.subjectId, stats);
      }
    }
    
    const subjectStatsList: Array<{
      subjectId: string;
      subjectName: string;
      total: number;
      correct: number;
      accuracy: number;
    }> = [];
    
    for (const s of subjectList) {
      const stats = subjectStatsMap.get(s.id);
      if (stats && (stats.total || 0) > 0) {
        subjectStatsList.push({
          subjectId: s.id,
          subjectName: s.name,
          total: stats.total || 0,
          correct: stats.correct || 0,
          accuracy: stats.accuracy || 0,
        });
      }
    }

    // 优先使用 exam_sessions 获取最近场次记录
    let recentRecords: any[] = [];
    try {
      const sessionRecords = await db.select({
        id: examSessions.id,
        subjectName: examSessions.subjectName,
        mode: examSessions.mode,
        totalQuestions: examSessions.totalQuestions,
        correctCount: examSessions.correctCount,
        duration: examSessions.duration,
        remainingTime: examSessions.remainingTime,
        completed: examSessions.completed,
        createdAt: examSessions.createdAt,
      }).from(examSessions).where(eq(examSessions.userId, userId)).orderBy(desc(examSessions.createdAt)).limit(10);
      
      // 获取每个场次的已答题数（实时统计）
      const sessionIds = sessionRecords.map(r => r.id);
      let answeredCountMap = new Map<string, number>();
      let correctCountMap = new Map<string, number>();
      
      if (sessionIds.length > 0) {
        // 从 answer_records 实时统计每个场次的答题数和正确数
        const statsBySession = await db.select({
          sessionId: answerRecords.sessionId,
          total: sql<number>`count(*)`,
          correct: sql<number>`sum(case when ${answerRecords.isCorrect} then 1 else 0 end)`,
        }).from(answerRecords)
          .where(inArray(answerRecords.sessionId, sessionIds))
          .groupBy(answerRecords.sessionId);
        
        for (const stat of statsBySession) {
          if (stat.sessionId) {
            answeredCountMap.set(stat.sessionId, Number(stat.total));
            correctCountMap.set(stat.sessionId, Number(stat.correct));
          }
        }
      }
      
      recentRecords = sessionRecords.map((r) => {
        const total = r.totalQuestions || 0;
        // 使用实时统计的答题数和正确数
        const answeredCount = answeredCountMap.get(r.id) || 0;
        const correct = correctCountMap.get(r.id) || 0;
        const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
        // 实时正确率：已答题中正确的比例
        const accuracy = answeredCount > 0 ? Math.round((correct / answeredCount) * 100) : 0;
        
        return {
          id: r.id,
          subjectName: r.subjectName || '未知科目',
          mode: r.mode,
          total,
          correct,
          answeredCount,
          progress,
          accuracy,
          createdAt: this.formatToShanghaiTime(r.createdAt),
          completed: r.completed,
          remainingTime: r.remainingTime || 0,
        };
      });
      
      console.log(`[Stats] 获取到 ${recentRecords.length} 条场次记录`);
    } catch (sessionError) {
      console.warn('[Stats] exam_sessions 查询失败，回退到 answer_records:', sessionError.message);
      
      // 回退方案：使用 answer_records
      const fallbackRecords = await db.select({
        id: answerRecords.id,
        subjectName: answerRecords.subjectName,
        mode: answerRecords.mode,
        isCorrect: answerRecords.isCorrect,
        createdAt: answerRecords.createdAt,
      }).from(answerRecords).where(eq(answerRecords.userId, userId)).orderBy(desc(answerRecords.createdAt)).limit(10);
      
      recentRecords = fallbackRecords.map((r) => ({
        id: r.id,
        subjectName: r.subjectName,
        mode: r.mode,
        total: 1,
        correct: r.isCorrect ? 1 : 0,
        accuracy: r.isCorrect ? 100 : 0,
        createdAt: this.formatToShanghaiTime(r.createdAt),
        completed: true,
      }));
    }

    return {
      totalQuestions,
      totalCorrect,
      accuracy,
      todayCount,
      streak,
      totalDays,
      subjectStats: subjectStatsList,
      recentRecords,
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
