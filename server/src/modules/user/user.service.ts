import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { users, answerRecords, userStats, subjectStats, favoriteRecords, questions } from '@/db/schema';
import { eq, and, count, desc, or, isNotNull } from 'drizzle-orm';
import * as https from 'https';
import { StorageService } from '../storage/storage.service';

export interface UserCreateDto {
  openid?: string;
  nickName?: string;
  avatarUrl?: string;
}

export interface UserStatsDto {
  userId: number;
  todayCount: number;
  totalQuestions: number;
  totalCorrect: number;
  streak: number;
  totalDays: number;
  lastStudyDate: string | null;
}

export interface SubjectStatDto {
  subjectId: string;
  subjectName: string;
  total: number;
  correct: number;
  accuracy: number;
}

@Injectable()
export class UserService {
  constructor(private storageService: StorageService) {}

  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  async createUser(data: UserCreateDto) {
    if (data.openid) {
      const existing = await db.select().from(users).where(eq(users.openid, data.openid)).limit(1);
      if (existing.length > 0) {
        return existing[0];
      }
    }

    const result = await db.insert(users).values({
      openid: data.openid || null,
      nickName: data.nickName || null,
      avatarUrl: data.avatarUrl || null,
    }).returning();
    return result[0];
  }

  async getUserById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByOpenid(openid: string) {
    const result = await db.select().from(users).where(eq(users.openid, openid)).limit(1);
    return result[0];
  }

  async getUserStats(userId: number): Promise<UserStatsDto> {
    const today = new Date().toISOString().split('T')[0];
    
    const todayResult = await db.select({ count: count() }).from(answerRecords).where(and(eq(answerRecords.userId, userId), eq(answerRecords.createdAt, today)));
    const todayCount = todayResult[0].count || 0;

    const correctResult = await db.select({ count: count() }).from(answerRecords).where(and(eq(answerRecords.userId, userId), eq(answerRecords.isCorrect, true)));
    const totalResult = await db.select({ count: count() }).from(answerRecords).where(eq(answerRecords.userId, userId));
    
    const totalQuestions = totalResult[0].count || 0;
    const totalCorrect = correctResult[0].count || 0;

    const existingStats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);

    let streak = 0;
    let totalDays = 0;
    let lastStudyDate: string | null = null;

    if (existingStats.length > 0) {
      streak = existingStats[0].streak || 0;
      totalDays = existingStats[0].totalDays || 0;
      const currentLastDate = existingStats[0].lastStudyDate;

      if (currentLastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (currentLastDate === yesterdayStr) {
          streak += 1;
        } else {
          streak = 1;
        }

        totalDays += 1;
        lastStudyDate = today;
      } else {
        lastStudyDate = today;
      }
    } else {
      streak = 1;
      totalDays = 1;
      lastStudyDate = today;
    }

    if (existingStats.length > 0) {
      await db.update(userStats).set({
        todayCount,
        totalQuestions,
        totalCorrect,
        streak,
        totalDays,
        lastStudyDate,
      }).where(eq(userStats.userId, userId));
    } else {
      await db.insert(userStats).values({
        userId,
        todayCount,
        totalQuestions,
        totalCorrect,
        streak,
        totalDays,
        lastStudyDate,
      });
    }

    return {
      userId,
      todayCount,
      totalQuestions,
      totalCorrect,
      streak,
      totalDays,
      lastStudyDate,
    };
  }

  async updateSubjectStats(userId: number, subjectId: string, subjectName: string, isCorrect: boolean) {
    const existing = await db.select().from(subjectStats).where(and(eq(subjectStats.userId, userId), eq(subjectStats.subjectId, subjectId))).limit(1);

    if (existing.length > 0) {
      const stat = existing[0];
      const newTotal = (stat.total || 0) + 1;
      const newCorrect = (stat.correct || 0) + (isCorrect ? 1 : 0);
      const newAccuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;

      await db.update(subjectStats).set({
        total: newTotal,
        correct: newCorrect,
        accuracy: newAccuracy,
      }).where(and(eq(subjectStats.userId, userId), eq(subjectStats.subjectId, subjectId)));
    } else {
      await db.insert(subjectStats).values({
        userId,
        subjectId,
        total: 1,
        correct: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
      });
    }
  }

  async getSubjectStats(userId: number): Promise<SubjectStatDto[]> {
    const result = await db.select().from(subjectStats).where(eq(subjectStats.userId, userId));
    return result.map(s => ({
      subjectId: s.subjectId || '',
      subjectName: '',
      total: s.total || 0,
      correct: s.correct || 0,
      accuracy: s.accuracy || 0,
    }));
  }

  async getWrongQuestions(userId: number, subjectId?: string) {
    let wrongRecords: any[];
    if (subjectId) {
      wrongRecords = await db.select({ questionId: answerRecords.questionId }).from(answerRecords).where(and(eq(answerRecords.isCorrect, false), eq(answerRecords.userId, userId), eq(answerRecords.subjectId, subjectId)));
    } else {
      wrongRecords = await db.select({ questionId: answerRecords.questionId }).from(answerRecords).where(and(eq(answerRecords.isCorrect, false), eq(answerRecords.userId, userId)));
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

  async getFavoriteQuestions(userId: number) {
    const favorites = await db.select({ questionId: favoriteRecords.questionId }).from(favoriteRecords).where(eq(favoriteRecords.userId, userId));
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

  async updateProfile(userId: number, nickName?: string, avatarUrl?: string) {
    const updateData: any = {};
    
    if (nickName) {
      updateData.nickName = nickName;
    }
    
    if (avatarUrl) {
      try {
        let avatarBuffer: Buffer;
        if (avatarUrl.startsWith('wxfile://')) {
          avatarBuffer = await this.downloadImage(avatarUrl);
        } else if (avatarUrl.startsWith('data:image/')) {
          const base64Data = avatarUrl.split(',')[1];
          avatarBuffer = Buffer.from(base64Data, 'base64');
        } else {
          avatarBuffer = await this.downloadImage(avatarUrl);
        }
        
        const ext = avatarUrl.includes('svg') ? 'svg' : 'png';
        const contentType = ext === 'svg' ? 'image/svg+xml' : 'image/png';
        
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const openid = user[0]?.openid || `user_${userId}`;
        
        const newAvatarUrl = await this.storageService.uploadFile(avatarBuffer, `avatar_${openid}_${Date.now()}.${ext}`, contentType);
        updateData.avatarUrl = newAvatarUrl;
      } catch (error) {
        console.error('Failed to upload avatar:', error);
      }
    }
    
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
      return result[0];
    }
    
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user[0];
  }

  async deleteUser(userId: number) {
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(userStats).where(eq(userStats.userId, userId));
    await db.delete(subjectStats).where(eq(subjectStats.userId, userId));
    await db.delete(answerRecords).where(eq(answerRecords.userId, userId));
    await db.delete(favoriteRecords).where(eq(favoriteRecords.userId, userId));
  }
}