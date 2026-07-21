import { Injectable } from '@nestjs/common';
import { questions, answerRecords } from '@/data/seed-data';

@Injectable()
export class ExamService {
  startExam(subjectId: string, _duration: number) {
    let examQuestions = questions.filter((q) => q.subjectId === subjectId);
    if (examQuestions.length === 0) {
      examQuestions = questions;
    }
    // Shuffle and pick up to 10 questions
    const shuffled = [...examQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    // Return without answers
    const safeQuestions = selected.map(({ answer, analysis, ...rest }) => rest);

    return {
      questions: safeQuestions,
      totalQuestions: safeQuestions.length,
      duration: _duration,
    };
  }

  submitExam(
    subjectId: string,
    answers: { questionId: string; answer: string }[],
    timeUsed: number,
  ) {
    let correct = 0;
    const total = answers.length;

    for (const ans of answers) {
      const question = questions.find((q) => q.id === ans.questionId);
      if (!question) continue;

      const isCorrect = ans.answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
      if (isCorrect) correct++;

      // Record the answer
      answerRecords.push({
        id: 'r' + Date.now() + Math.random().toString(36).substring(2, 6),
        questionId: ans.questionId,
        userAnswer: ans.answer,
        isCorrect,
        mode: 'exam',
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    // Also count unanswered questions as wrong
    const allQuestionsInExam = questions.filter((q) => q.subjectId === subjectId);
    const totalQuestions = allQuestionsInExam.length > 0 ? Math.min(10, allQuestionsInExam.length) : total;
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    return {
      total: totalQuestions,
      correct,
      score,
      timeUsed,
    };
  }
}
