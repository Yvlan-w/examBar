import { Injectable, OnModuleInit } from '@nestjs/common';
import { db } from '@/db/db.module';
import { questions, subjects, answerRecords, favoriteRecords } from '@/db/schema';
import { eq, and, count, desc, or, isNotNull } from 'drizzle-orm';
import {
  subjects as seedSubjects,
  questions as seedQuestions,
} from '@/data/seed-data';

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
  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    const subjectCount = await db.select({ count: count() }).from(subjects);
    if (subjectCount[0].count === 0) {
      await db.insert(subjects).values(seedSubjects);
    }

    const questionCount = await db.select({ count: count() }).from(questions);
    if (questionCount[0].count === 0) {
      await db.insert(questions).values(seedQuestions);
    }
  }

  async getSubjects() {
    const result = await db.select().from(subjects);
    return result;
  }

  async getQuestions(subjectId?: string, type?: string, difficulty?: string) {
    const conditions: any[] = [];
    if (subjectId) conditions.push(eq(questions.subjectId, subjectId));
    if (type && type !== 'all') conditions.push(eq(questions.type, type));
    if (difficulty && difficulty !== 'all') conditions.push(eq(questions.difficulty, difficulty));

    const query = conditions.length > 0
      ? db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
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
      difficulty: questions.difficulty,
      subjectId: questions.subjectId,
      subjectName: questions.subjectName,
      year: questions.year,
    }).from(questions).offset(randomIndex).limit(1);

    return result[0];
  }

  async submitAnswer(questionId: string, answer: string, mode: string, userId?: number) {
    const question = await this.getQuestionById(questionId);
    if (!question) return null;

    const isCorrect = answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
    const recordId = 'r' + Date.now() + Math.random().toString(36).substring(2, 6);
    const createdAt = new Date().toISOString().split('T')[0];

    await db.insert(answerRecords).values({
      id: recordId,
      questionId,
      userId: userId || null,
      userAnswer: answer,
      isCorrect,
      mode,
      subjectId: question.subjectId,
      subjectName: question.subjectName,
      createdAt,
    });

    return {
      isCorrect,
      correctAnswer: question.answer,
      analysis: question.analysis || '',
      record: {
        id: recordId,
        questionId,
        userId,
        userAnswer: answer,
        isCorrect,
        mode,
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        createdAt,
      },
    };
  }

  async getAnswerRecords(userId?: number) {
    if (userId) {
      return await db.select().from(answerRecords).where(eq(answerRecords.userId, userId));
    }
    return await db.select().from(answerRecords);
  }

  async getHistoryQuestions(subjectId?: string, year?: string) {
    const conditions: any[] = [];
    if (subjectId) conditions.push(eq(questions.subjectId, subjectId));
    if (year && year !== 'all') conditions.push(eq(questions.year, parseInt(year)));

    const query = conditions.length > 0
      ? db.select({
          id: questions.id,
          content: questions.content,
          type: questions.type,
          options: questions.options,
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
          difficulty: questions.difficulty,
          subjectId: questions.subjectId,
          subjectName: questions.subjectName,
          year: questions.year,
        }).from(questions);

    return await query;
  }

  async getYears() {
    const result = await db.select({ year: questions.year }).from(questions).where(isNotNull(questions.year)).groupBy(questions.year).orderBy(desc(questions.year));
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