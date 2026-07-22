import { Injectable } from '@nestjs/common';
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

    console.log('WX_APP_ID:', appId ? 'configured' : 'not configured');
    console.log('WX_APP_SECRET:', secret ? 'configured' : 'not configured');

    if (!appId || !secret) {
      console.error('Wechat app config missing');
      return {
        success: false,
        message: '微信小程序配置未完成，请联系管理员',
      };
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    console.log('Calling wechat API:', url);

    return new Promise<any>((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('Wechat API response:', result);
            
            if (result.errcode) {
              console.error('Wechat API error:', result.errmsg);
              resolve({
                success: false,
                message: `微信登录失败: ${result.errmsg}`,
                errcode: result.errcode,
              });
            } else {
              resolve({
                success: true,
                data: result,
              });
            }
          } catch (error) {
            console.error('Parse wechat response error:', error);
            resolve({
              success: false,
              message: '微信登录失败，请重试',
            });
          }
        });
      }).on('error', (err) => {
        console.error('Wechat API request error:', err);
        resolve({
          success: false,
          message: '微信登录失败，请重试',
        });
      });
    });
  }

  async login(code: string) {
    console.log('Login with code:', code);
    
    let openid: string;
    let unionid: string | undefined;
    let session_key: string | undefined;
    
    if (code === 'h5_login') {
      openid = 'h5_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      console.log('H5 anonymous login, generated openid:', openid);
    } else {
      const sessionData = await this.code2Session(code);
      
      if (!sessionData.success) {
        return {
          success: false,
          message: sessionData.message,
        };
      }

      const { openid: wxOpenid, unionid: wxUnionid, session_key: wxSessionKey } = sessionData.data;
      openid = wxOpenid;
      unionid = wxUnionid;
      session_key = wxSessionKey;
      console.log('Got openid:', openid);
    }

    try {
      let user = await db.select().from(users).where(eq(users.openid, openid)).limit(1);

      if (user.length === 0) {
        console.log('Creating new user for openid:', openid);
        const result = await db.insert(users).values({
          openid,
        }).returning();
        user = result;
      }

      return {
        success: true,
        data: {
          user: user[0],
          sessionKey: session_key,
          unionid,
        },
      };
    } catch (error) {
      console.error('Database error during login:', error);
      return {
        success: false,
        message: '登录失败，请重试',
      };
    }
  }

  async loginH5(openid: string, nickName?: string, avatarUrl?: string) {
    console.log('H5 login with openid:', openid);
    
    try {
      let user = await db.select().from(users).where(eq(users.openid, openid)).limit(1);

      if (user.length === 0) {
        console.log('Creating new H5 user:', openid);
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

      return {
        success: true,
        data: user[0],
      };
    } catch (error) {
      console.error('Database error during H5 login:', error);
      return {
        success: false,
        message: '登录失败，请重试',
      };
    }
  }
}