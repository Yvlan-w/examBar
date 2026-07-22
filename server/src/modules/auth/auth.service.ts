import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as https from 'https';
import { db } from '@/db/db.module';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

@Injectable()
export class AuthService {
  async code2Session(code: string) {
    const appId = process.env.WX_APP_ID;
    const secret = process.env.WX_APP_SECRET;

    if (!appId || !secret) {
      throw new UnauthorizedException('微信小程序配置未完成');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    return new Promise<any>((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.errcode) {
              reject(new UnauthorizedException(`微信登录失败: ${result.errmsg}`));
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(new UnauthorizedException('微信登录失败，请重试'));
          }
        });
      }).on('error', () => {
        reject(new UnauthorizedException('微信登录失败，请重试'));
      });
    });
  }

  async login(code: string) {
    const sessionData = await this.code2Session(code);
    const { openid, unionid, session_key } = sessionData;

    let user = await db.select().from(users).where(eq(users.openid, openid)).limit(1);

    if (user.length === 0) {
      const result = await db.insert(users).values({
        openid,
      }).returning();
      user = result;
    }

    return {
      user: user[0],
      sessionKey: session_key,
      unionid,
    };
  }

  async loginH5(openid: string, nickName?: string, avatarUrl?: string) {
    let user = await db.select().from(users).where(eq(users.openid, openid)).limit(1);

    if (user.length === 0) {
      const result = await db.insert(users).values({
        openid,
        nickName: nickName || null,
        avatarUrl: avatarUrl || null,
      }).returning();
      user = result;
    } else if (nickName || avatarUrl) {
      const result = await db.update(users).set({
        nickName: nickName || user[0].nickName,
        avatarUrl: avatarUrl || user[0].avatarUrl,
      }).where(eq(users.openid, openid)).returning();
      user = result;
    }

    return user[0];
  }
}