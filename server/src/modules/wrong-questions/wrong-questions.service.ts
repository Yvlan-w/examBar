import { Injectable, Logger } from '@nestjs/common';
import { db } from '@/db/db.module';
import { wrongQuestions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const MASTER_THRESHOLD = 2;

export interface WrongQuestionRecord {
  id: string;
  userId: number;
  questionId: string;
  subjectId?: string | null;
  wrongCount: number;
  consecutiveCorrect: number;
  lastWrongAt: Date | null;
  mastered: boolean;
  masteredAt: Date | null;
  updatedAt: Date | null;
}

export interface RecordAnswerResult {
  record: WrongQuestionRecord | null;
  mastered: boolean;
  newlyMastered: boolean;
}

@Injectable()
export class WrongQuestionsService {
  private readonly logger = new Logger(WrongQuestionsService.name);

  /**
   * 每次答题后调用 — 维护错题记录 + 掌握度判定
   *
   * 掌握规则：连续答对 2 次 → mastered = true
   * 答错一次 → consecutiveCorrect 归零，重新累计
   */
  async recordAnswer(
    userId: number,
    questionId: string,
    subjectId: string | undefined | null,
    isCorrect: boolean,
  ): Promise<RecordAnswerResult> {
    if (!userId || !questionId) {
      return { record: null, mastered: false, newlyMastered: false };
    }

    const idempotencyKey = `${userId}:${questionId}:${Date.now()}`;

    const existing = await db
      .select()
      .from(wrongQuestions)
      .where(and(eq(wrongQuestions.userId, userId), eq(wrongQuestions.questionId, questionId)))
      .limit(1);

    const existingRecord = existing[0];

    if (!isCorrect) {
      // === 答错 ===
      if (existingRecord) {
        // 已有记录 → 累加错误次数，重置连续正确，移除掌握状态
        await db
          .update(wrongQuestions)
          .set({
            wrongCount: (existingRecord.wrongCount || 0) + 1,
            consecutiveCorrect: 0,
            mastered: false,
            masteredAt: null,
            lastWrongAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(wrongQuestions.id, existingRecord.id));

        const updated = (await db.select().from(wrongQuestions).where(eq(wrongQuestions.id, existingRecord.id)).limit(1))[0];
        this.logger.debug(`[WrongQ] 答错 → ${questionId} wrongCount=${updated.wrongCount}, consecutiveCorrect=0`);
        return { record: updated as any, mastered: false, newlyMastered: false };
      } else {
        // 首次答错 → 新建错题记录
        const newId = 'wq' + Date.now() + Math.random().toString(36).substring(2, 6);
        await db.insert(wrongQuestions).values({
          id: newId,
          userId,
          questionId,
          subjectId: subjectId || null,
          wrongCount: 1,
          consecutiveCorrect: 0,
          lastWrongAt: new Date(),
          mastered: false,
        });
        const created = (await db.select().from(wrongQuestions).where(eq(wrongQuestions.id, newId)).limit(1))[0];
        this.logger.debug(`[WrongQ] 首次答错 → 新建 ${questionId}`);
        return { record: created as any, mastered: false, newlyMastered: false };
      }
    }

    // === 答对 ===
    if (!existingRecord) {
      // 这题从来没错过 → 不需要在错题本里跟踪
      return { record: null, mastered: false, newlyMastered: false };
    }

    if (existingRecord.mastered) {
      // 已经掌握了 → 答对不改变状态
      return { record: existingRecord as any, mastered: true, newlyMastered: false };
    }

    // 已有错题记录且未掌握 → 累加连续正确
    const newConsecutive = (existingRecord.consecutiveCorrect || 0) + 1;
    const isNowMastered = newConsecutive >= MASTER_THRESHOLD;

    const updatedSet: any = {
      consecutiveCorrect: newConsecutive,
      updatedAt: new Date(),
    };

    if (isNowMastered) {
      updatedSet.mastered = true;
      updatedSet.masteredAt = new Date();
    }

    await db
      .update(wrongQuestions)
      .set(updatedSet)
      .where(eq(wrongQuestions.id, existingRecord.id));

    const updated = (await db.select().from(wrongQuestions).where(eq(wrongQuestions.id, existingRecord.id)).limit(1))[0];
    this.logger.debug(
      `[WrongQ] 答对 → ${questionId} consecutiveCorrect=${newConsecutive} mastered=${isNowMastered}`,
    );

    return {
      record: updated as any,
      mastered: isNowMastered,
      newlyMastered: isNowMastered && ((existingRecord.consecutiveCorrect ?? 0) < MASTER_THRESHOLD),
    };
  }

  async getByUserAndQuestion(userId: number, questionId: string) {
    const rows = await db
      .select()
      .from(wrongQuestions)
      .where(and(eq(wrongQuestions.userId, userId), eq(wrongQuestions.questionId, questionId)))
      .limit(1);
    return rows[0] || null;
  }

  async markMastered(userId: number, questionId: string) {
    await db
      .update(wrongQuestions)
      .set({ mastered: true, masteredAt: new Date(), updatedAt: new Date() })
      .where(and(eq(wrongQuestions.userId, userId), eq(wrongQuestions.questionId, questionId)));
  }

  async unmarkMastered(userId: number, questionId: string) {
    await db
      .update(wrongQuestions)
      .set({ mastered: false, masteredAt: null, consecutiveCorrect: 0, updatedAt: new Date() })
      .where(and(eq(wrongQuestions.userId, userId), eq(wrongQuestions.questionId, questionId)));
  }

  async remove(userId: number, questionId: string) {
    await db
      .delete(wrongQuestions)
      .where(and(eq(wrongQuestions.userId, userId), eq(wrongQuestions.questionId, questionId)));
  }
}
