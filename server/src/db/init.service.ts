import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class DbInitService implements OnModuleInit {
  constructor(@Inject('DB_CLIENT') private readonly client: Client) {}

  async onModuleInit() {
    await this.createTablesIfNotExist();
  }

  private async createTablesIfNotExist() {
    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          openid VARCHAR(128) UNIQUE,
          nick_name VARCHAR(128),
          avatar_url VARCHAR(512),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`,
      },
      {
        name: 'subjects',
        sql: `CREATE TABLE IF NOT EXISTS subjects (
          id VARCHAR(32) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          icon VARCHAR(64),
          question_count INTEGER DEFAULT 0,
          color VARCHAR(32),
          created_at TIMESTAMP DEFAULT NOW()
        )`,
      },
      {
        name: 'questions',
        sql: `CREATE TABLE IF NOT EXISTS questions (
          id VARCHAR(32) PRIMARY KEY,
          content TEXT NOT NULL,
          type VARCHAR(32) NOT NULL,
          options JSON,
          answer TEXT NOT NULL,
          analysis TEXT,
          difficulty VARCHAR(32) DEFAULT 'easy',
          subject_id VARCHAR(32) NOT NULL REFERENCES subjects(id),
          subject_name VARCHAR(128) NOT NULL,
          year INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
      },
      {
        name: 'exam_sessions',
        sql: `CREATE TABLE IF NOT EXISTS exam_sessions (
          id VARCHAR(64) PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          mode VARCHAR(32) NOT NULL,
          subject_id VARCHAR(32),
          subject_name VARCHAR(128),
          total_questions INTEGER DEFAULT 0,
          correct_count INTEGER DEFAULT 0,
          duration INTEGER DEFAULT 0,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        )`,
      },
      {
        name: 'answer_records',
        sql: `CREATE TABLE IF NOT EXISTS answer_records (
          id VARCHAR(64) PRIMARY KEY,
          session_id VARCHAR(64) REFERENCES exam_sessions(id),
          user_id INTEGER REFERENCES users(id),
          question_id VARCHAR(32) NOT NULL REFERENCES questions(id),
          user_answer TEXT NOT NULL,
          is_correct BOOLEAN NOT NULL DEFAULT FALSE,
          mode VARCHAR(32) NOT NULL,
          subject_id VARCHAR(32),
          subject_name VARCHAR(128),
          created_at DATE DEFAULT NOW()
        )`,
      },
      {
        name: 'favorite_records',
        sql: `CREATE TABLE IF NOT EXISTS favorite_records (
          id VARCHAR(64) PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          question_id VARCHAR(32) NOT NULL REFERENCES questions(id),
          created_at DATE DEFAULT NOW()
        )`,
      },
      {
        name: 'user_stats',
        sql: `CREATE TABLE IF NOT EXISTS user_stats (
          user_id INTEGER PRIMARY KEY REFERENCES users(id),
          today_count INTEGER DEFAULT 0,
          total_questions INTEGER DEFAULT 0,
          total_correct INTEGER DEFAULT 0,
          streak INTEGER DEFAULT 0,
          total_days INTEGER DEFAULT 0,
          last_study_date DATE,
          updated_at TIMESTAMP DEFAULT NOW()
        )`,
      },
      {
        name: 'subject_stats',
        sql: `CREATE TABLE IF NOT EXISTS subject_stats (
          user_id INTEGER REFERENCES users(id),
          subject_id VARCHAR(32) REFERENCES subjects(id),
          total INTEGER DEFAULT 0,
          correct INTEGER DEFAULT 0,
          accuracy INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (user_id, subject_id)
        )`,
      },
      {
        name: 'custom_subjects',
        sql: `CREATE TABLE IF NOT EXISTS custom_subjects (
          id VARCHAR(32) PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          name VARCHAR(128) NOT NULL,
          is_public BOOLEAN DEFAULT FALSE,
          icon VARCHAR(64),
          color VARCHAR(32),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`,
      },
    ];

    for (const table of tables) {
      try {
        await this.client.query(table.sql);
        console.log(`Table "${table.name}" checked/created successfully`);
      } catch (error) {
        console.error(`Error creating table "${table.name}":`, error);
      }
    }

    // 迁移：为已存在的表添加新字段
    const migrations = [
      {
        name: 'exam_sessions table',
        sql: `CREATE TABLE IF NOT EXISTS exam_sessions (
          id VARCHAR(64) PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          mode VARCHAR(32) NOT NULL,
          subject_id VARCHAR(32),
          subject_name VARCHAR(128),
          total_questions INTEGER DEFAULT 0,
          correct_count INTEGER DEFAULT 0,
          duration INTEGER DEFAULT 0,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        )`,
      },
      {
        name: 'answer_records.session_id',
        sql: `ALTER TABLE answer_records ADD COLUMN IF NOT EXISTS session_id VARCHAR(64) REFERENCES exam_sessions(id)`,
      },
    ];

    for (const migration of migrations) {
      try {
        await this.client.query(migration.sql);
        console.log(`Migration "${migration.name}" applied successfully`);
      } catch (error) {
        console.warn(`Migration "${migration.name}" note:`, error.message);
      }
    }

    console.log('Database tables initialization completed');
  }
}