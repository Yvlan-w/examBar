import { Injectable } from '@nestjs/common';
import {
  subjects,
  questions,
  answerRecords,
  favoriteRecords,
  type SubjectData,
  type QuestionData,
  type AnswerRecord,
  type FavoriteRecord,
} from '@/data/seed-data';

@Injectable()
export class QuestionService {
  getSubjects(): SubjectData[] {
    return subjects;
  }

  getQuestions(subjectId?: string, type?: string): Omit<QuestionData, 'answer' | 'analysis'>[] {
    let result = questions;
    if (subjectId) {
      result = result.filter((q) => q.subjectId === subjectId);
    }
    if (type && type !== 'all') {
      result = result.filter((q) => q.type === type);
    }
    // Return questions without answer/analysis for listing
    return result.map(({ answer, analysis, ...rest }) => rest);
  }

  getQuestionById(id: string): QuestionData | undefined {
    return questions.find((q) => q.id === id);
  }

  getDailyQuestion(): Omit<QuestionData, 'answer' | 'analysis'> | undefined {
    // Pick a random question based on today's date
    const today = new Date();
    const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % questions.length;
    const q = questions[dayIndex];
    if (!q) return undefined;
    const { answer, analysis, ...rest } = q;
    return rest;
  }

  submitAnswer(questionId: string, answer: string, mode: string): {
    isCorrect: boolean;
    correctAnswer: string;
    analysis: string;
    record: AnswerRecord;
  } | null {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return null;

    const isCorrect = answer.trim().toUpperCase() === question.answer.trim().toUpperCase();
    const record: AnswerRecord = {
      id: 'r' + Date.now() + Math.random().toString(36).substring(2, 6),
      questionId,
      userAnswer: answer,
      isCorrect,
      mode,
      subjectId: question.subjectId,
      subjectName: question.subjectName,
      createdAt: new Date().toISOString().split('T')[0],
    };
    answerRecords.push(record);

    return {
      isCorrect,
      correctAnswer: question.answer,
      analysis: question.analysis,
      record,
    };
  }

  getAnswerRecords(): AnswerRecord[] {
    return answerRecords;
  }

  getHistoryQuestions(subjectId?: string, year?: string): Omit<QuestionData, 'answer' | 'analysis'>[] {
    let result = questions.filter((q) => q.year && q.type !== 'short');
    if (subjectId) {
      result = result.filter((q) => q.subjectId === subjectId);
    }
    if (year && year !== 'all') {
      result = result.filter((q) => q.year === parseInt(year));
    }
    return result.map(({ answer, analysis, ...rest }) => rest);
  }

  getYears(): number[] {
    const years = [...new Set(questions.filter((q) => q.year).map((q) => q.year!))].sort((a, b) => b - a);
    return years;
  }

  toggleFavorite(questionId: string): { isFavorite: boolean } {
    const existingIndex = favoriteRecords.findIndex((f) => f.questionId === questionId);
    if (existingIndex >= 0) {
      favoriteRecords.splice(existingIndex, 1);
      return { isFavorite: false };
    } else {
      const record: FavoriteRecord = {
        id: 'f' + Date.now() + Math.random().toString(36).substring(2, 6),
        questionId,
        createdAt: new Date().toISOString().split('T')[0],
      };
      favoriteRecords.push(record);
      return { isFavorite: true };
    }
  }

  isFavorite(questionId: string): boolean {
    return favoriteRecords.some((f) => f.questionId === questionId);
  }

  getFavoriteQuestions(): Omit<QuestionData, 'answer' | 'analysis'>[] {
    const favoriteIds = favoriteRecords.map((f) => f.questionId);
    const result = questions.filter((q) => favoriteIds.includes(q.id));
    return result.map(({ answer, analysis, ...rest }) => rest);
  }
}
