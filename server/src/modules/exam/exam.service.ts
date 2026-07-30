import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { questions, answerRecords, examSessions, sessionQuestions } from '@/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class ExamService {
  constructor(private readonly statsService: StatsService) {}

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
      try {
        await db.insert(examSessions).values({
          id: sessionId,
          userId: userId || null,
          mode: 'exam',
          subjectId: subjectId || firstQuestion.subjectId,
          subjectName: firstQuestion.subjectName,
          totalQuestions: selected.length,
          correctCount: 0,
          duration,
          completed: false,
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

      const isCorrect = ans.answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
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
    }

    // 更新场次统计并标记完成
    if (sessionId) {
      try {
        await db.update(examSessions).set({
          correctCount: correct,
          completed: true,
          completedAt: new Date(),
          duration: timeUsed,
        }).where(eq(examSessions.id, sessionId));
        console.log(`[Session] 模拟考试完成场次: ${sessionId}, 正确: ${correct}/${total}`);
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
}
