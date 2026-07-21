import { Injectable } from '@nestjs/common';
import { answerRecords, subjects } from '@/data/seed-data';

@Injectable()
export class StatsService {
  getOverview() {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = answerRecords.filter((r) => r.createdAt === today).length;

    // Calculate streak (consecutive days)
    const uniqueDays = [...new Set(answerRecords.map((r) => r.createdAt))].sort().reverse();
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

  getDetail() {
    const totalQuestions = answerRecords.length;
    const totalCorrect = answerRecords.filter((r) => r.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const todayCount = answerRecords.filter((r) => r.createdAt === today).length;

    // Streak
    const uniqueDays = [...new Set(answerRecords.map((r) => r.createdAt))].sort().reverse();
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

    // Subject stats
    const subjectStats = subjects.map((s) => {
      const subjectRecords = answerRecords.filter((r) => r.subjectId === s.id);
      const subjectCorrect = subjectRecords.filter((r) => r.isCorrect).length;
      const subjectTotal = subjectRecords.length;
      return {
        subjectId: s.id,
        subjectName: s.name,
        total: subjectTotal,
        correct: subjectCorrect,
        accuracy: subjectTotal > 0 ? Math.round((subjectCorrect / subjectTotal) * 100) : 0,
      };
    }).filter((s) => s.total > 0);

    // Recent records (last 10)
    const recentRecords = answerRecords
      .slice(-50)
      .reverse()
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        subjectName: r.subjectName,
        mode: r.mode,
        total: 1,
        correct: r.isCorrect ? 1 : 0,
        accuracy: r.isCorrect ? 100 : 0,
        createdAt: r.createdAt,
      }));

    return {
      totalQuestions,
      totalCorrect,
      accuracy,
      todayCount,
      streak,
      totalDays,
      subjectStats,
      recentRecords,
    };
  }
}
