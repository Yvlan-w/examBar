import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:Enu75Z3nFYgp2o8mA2@cp-dandy-frost-ee728055.pg5.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require',
  },
});