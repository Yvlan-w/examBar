import { Injectable } from '@nestjs/common';
import {
  subjects,
  questions,
  answerRecords,
  type SubjectData,
  type QuestionData,
  type AnswerRecord,
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
}
