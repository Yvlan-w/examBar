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

export const answerRecords = pgTable('answer_records', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: integer('user_id').references(() => users.id),
  questionId: varchar('question_id', { length: 32 }).notNull().references(() => questions.id),
  userAnswer: text('user_answer').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  mode: varchar('mode', { length: 32 }).notNull(),
  subjectId: varchar('subject_id', { length: 32 }),
  subjectName: varchar('subject_name', { length: 128 }),
  createdAt: date('created_at').defaultNow(),
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