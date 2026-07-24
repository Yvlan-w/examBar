import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { questions, answerRecords } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class ExamService {
  constructor(private readonly statsService: StatsService) {}
  async startExam(subjectId: string, duration: number, questionCount: number = 20) {
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
      };
    }

    const shuffled = [...examQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    const safeQuestions = selected.map(({ answer, analysis, ...rest }) => rest);

    return {
      questions: safeQuestions,
      totalQuestions: safeQuestions.length,
      duration,
    };
  }

  async submitExam(
    subjectId: string,
    answers: { questionId: string; answer: string }[],
    timeUsed: number,
    userId?: number,
  ) {
    let correct = 0;
    const total = answers.length;
    const createdAt = new Date().toISOString().split('T')[0];

    for (const ans of answers) {
      const questionResult = await db.select().from(questions).where(eq(questions.id, ans.questionId)).limit(1);
      const question = questionResult[0];
      if (!question) continue;

      const isCorrect = ans.answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
      if (isCorrect) correct++;

      await db.insert(answerRecords).values({
        id: 'r' + Date.now() + Math.random().toString(36).substring(2, 6),
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
}
