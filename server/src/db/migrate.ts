import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';
import { subjects, questions } from '../data/seed-data';
import * as dotenv from 'dotenv';
import { sql, count } from 'drizzle-orm';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Enu75Z3nFYgp2o8mA2@cp-dandy-frost-ee728055.pg5.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=verify-full';

const runMigration = async () => {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const db = drizzle(client, { schema });

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        openid VARCHAR(128) UNIQUE,
        nick_name VARCHAR(128),
        avatar_url VARCHAR(512),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created users table');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        icon VARCHAR(64),
        question_count INTEGER DEFAULT 0,
        color VARCHAR(32),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created subjects table');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS questions (
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
      );
    `);
    console.log('Created questions table');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS answer_records (
        id VARCHAR(64) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        question_id VARCHAR(32) NOT NULL REFERENCES questions(id),
        user_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL DEFAULT FALSE,
        mode VARCHAR(32) NOT NULL,
        subject_id VARCHAR(32),
        subject_name VARCHAR(128),
        created_at DATE DEFAULT NOW()
      );
    `);
    console.log('Created answer_records table');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS favorite_records (
        id VARCHAR(64) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        question_id VARCHAR(32) NOT NULL REFERENCES questions(id),
        created_at DATE DEFAULT NOW()
      );
    `);
    console.log('Created favorite_records table');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        today_count INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        total_correct INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        total_days INTEGER DEFAULT 0,
        last_study_date DATE,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created user_stats table');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subject_stats (
        user_id INTEGER REFERENCES users(id),
        subject_id VARCHAR(32) REFERENCES subjects(id),
        total INTEGER DEFAULT 0,
        correct INTEGER DEFAULT 0,
        accuracy INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, subject_id)
      );
    `);
    console.log('Created subject_stats table');

    const subjectCount = await db.select({ count: count() }).from(schema.subjects);
    if (subjectCount[0].count === 0) {
      await db.insert(schema.subjects).values(subjects);
      console.log('Inserted seed subjects');
    }

    const questionCount = await db.select({ count: count() }).from(schema.questions);
    if (questionCount[0].count === 0) {
      await db.insert(schema.questions).values(questions);
      console.log('Inserted seed questions');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
};

runMigration();