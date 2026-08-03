// 预置题库数据 - 从JSON文件导入

import subjectsData from './subjects.json';
import s1Questions from './s1-questions.json';
import s2Questions from './s2-questions.json';
import s3Questions from './s3-questions.json';
import s4Questions from './s4-questions.json';

export interface SubjectData {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
  color: string;
}

export interface OptionData {
  label: string;
  content: string;
}

export interface QuestionData {
  id: string;
  content: string;
  type: 'choice' | 'multi' | 'judge' | 'short';
  options?: OptionData[];
  answer: string;
  analysis: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subjectId: string;
  subjectName: string;
  year?: number;
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  mode: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
}

export interface FavoriteRecord {
  id: string;
  questionId: string;
  createdAt: string;
}

export const subjects: SubjectData[] = subjectsData as SubjectData[];

export const questions: QuestionData[] = [
  ...s1Questions,
  ...s2Questions,
  ...s3Questions,
  ...s4Questions,
] as QuestionData[];

export const answerRecords: AnswerRecord[] = [];

export const favoriteRecords: FavoriteRecord[] = [];
