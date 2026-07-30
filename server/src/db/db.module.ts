import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import { DbInitService } from './init.service';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Enu75Z3nFYgp2o8mA2@cp-dandy-frost-ee728055.pg5.aidap-global.cn-beijing.volces.com:5432/postgres?sslmode=require&channel_binding=require';

export const client = new Client({
  connectionString: DATABASE_URL,
  statement_timeout: 30000,
});

export const db = drizzle(client, { schema });

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useFactory: async () => {
        await client.connect();
        console.log('PostgreSQL connected successfully');
        
        // 设置会话时区为东八区 (Asia/Shanghai)
        await client.query("SET TIME ZONE 'Asia/Shanghai'");
        console.log('Database timezone set to Asia/Shanghai');
        
        return db;
      },
    },
    {
      provide: 'DB_CLIENT',
      useFactory: () => {
        return client;
      },
    },
    DbInitService,
  ],
  exports: ['DATABASE', 'DB_CLIENT', DbInitService],
})
export class DbModule {}