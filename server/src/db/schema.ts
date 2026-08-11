import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  json,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  openid: varchar('openid', { length: 128 }).unique(),
  nickName: varchar('nick_name', { length: 128 }),
  avatarUrl: varchar('avatar_url', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subjects = pgTable('subjects', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  icon: varchar('icon', { length: 64 }),
  questionCount: integer('question_count').default(0),
  color: varchar('color', { length: 32 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const questions = pgTable('questions', {
  id: varchar('id', { length: 32 }).primaryKey(),
  content: text('content').notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  options: json('options'),
  answer: text('answer').notNull(),
  analysis: text('analysis'),
  difficulty: varchar('difficulty', { length: 32 }).default('easy'),
  subjectId: varchar('subject_id', { length: 32 }).notNull().references(() => subjects.id),
  subjectName: varchar('subject_name', { length: 128 }).notNull(),
  year: integer('year'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const examSessions = pgTable('exam_sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: integer('user_id').references(() => users.id),
  mode: varchar('mode', { length: 32 }).notNull(),
  subjectId: varchar('subject_id', { length: 32 }),
  subjectName: varchar('subject_name', { length: 128 }),
  totalQuestions: integer('total_questions').default(0),
  correctCount: integer('correct_count').default(0),
  duration: integer('duration').default(0),
  elapsedTime: integer('elapsed_time').default(0),
  remainingTime: integer('remaining_time').default(0),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const sessionQuestions = pgTable('session_questions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sessionId: varchar('session_id', { length: 64 }).notNull().references(() => examSessions.id),
  questionId: varchar('question_id', { length: 32 }).notNull().references(() => questions.id),
  orderIndex: integer('order_index').notNull().default(0),
  answered: boolean('answered').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const answerRecords = pgTable('answer_records', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sessionId: varchar('session_id', { length: 64 }).references(() => examSessions.id),
  userId: integer('user_id').references(() => users.id),
  questionId: varchar('question_id', { length: 32 }).notNull().references(() => questions.id),
  userAnswer: text('user_answer').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  mode: varchar('mode', { length: 32 }).notNull(),
  subjectId: varchar('subject_id', { length: 32 }),
  subjectName: varchar('subject_name', { length: 128 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const favoriteRecords = pgTable('favorite_records', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: integer('user_id').references(() => users.id),
  questionId: varchar('question_id', { length: 32 }).notNull().references(() => questions.id),
  createdAt: date('created_at').defaultNow(),
});

export const userStats = pgTable('user_stats', {
  userId: integer('user_id').references(() => users.id).primaryKey(),
  todayCount: integer('today_count').default(0),
  totalQuestions: integer('total_questions').default(0),
  totalCorrect: integer('total_correct').default(0),
  streak: integer('streak').default(0),
  totalDays: integer('total_days').default(0),
  lastStudyDate: date('last_study_date'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subjectStats = pgTable('subject_stats', {
  userId: integer('user_id').references(() => users.id),
  subjectId: varchar('subject_id', { length: 32 }).references(() => subjects.id),
  total: integer('total').default(0),
  correct: integer('correct').default(0),
  accuracy: integer('accuracy').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.subjectId] }),
}));

export const wrongQuestions = pgTable('wrong_questions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  questionId: varchar('question_id', { length: 32 }).notNull().references(() => questions.id),
  subjectId: varchar('subject_id', { length: 32 }),
  wrongCount: integer('wrong_count').default(1),
  consecutiveCorrect: integer('consecutive_correct').default(0),
  lastWrongAt: timestamp('last_wrong_at').defaultNow(),
  mastered: boolean('mastered').default(false),
  masteredAt: timestamp('mastered_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueUserQuestion: uniqueIndex('uq_wrong_questions_user_question').on(table.userId, table.questionId),
}));

export const customSubjects = pgTable('custom_subjects', {
  id: varchar('id', { length: 32 }).primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name', { length: 128 }).notNull(),
  isPublic: boolean('is_public').default(false),
  icon: varchar('icon', { length: 64 }),
  color: varchar('color', { length: 32 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});