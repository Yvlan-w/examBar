import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Enu75Z3nFYgp2o8mA2@cp-dandy-frost-ee728055.pg5.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: DATABASE_URL,
});

client.connect().then(() => {
  console.log('PostgreSQL connected successfully');
}).catch((err) => {
  console.error('PostgreSQL connection failed:', err);
});

export const db = drizzle(client, { schema });

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useValue: db,
    },
  ],
  exports: ['DATABASE'],
})
export class DbModule {}