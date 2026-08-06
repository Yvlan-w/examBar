import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as https from 'https';
import { db } from '@/db/db.module';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { StorageService } from '../storage/storage.service';

dotenv.config();

const adjectives = [
    "勤奋", "笃行", "善思", "明悟", "致远", "逐光", "向上", "笃志", "敏学", "慎思",
    "博学", "观澜", "知微", "登高", "清研", "潜修", "砺学", "启知", "思远", "精进",
    "恒持", "求真", "拾知", "探微", "观理", "澄心", "博闻", "凝思", "沐知", "向学",
    "耘思", "初晓", "温知", "静研", "溯理", "寻知", "观书", "睿见", "修学", "拓知",
    "勤思", "怀远", "凝悟", "昭学", "安研", "思笃", "知途", "悟恒", "砺行", "怀瑾"
  ];
const nouns = [
    "学子", "书生", "行者", "学者", "习者", "少年", "墨客", "悟者", "研者",
    "追光者", "求索者", "寻路人", "赶考人", "耕读人", "明理人", "静思者", "览书人"
];

@Injectable()
export class AuthService {
  constructor(private storageService: StorageService) {}

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

  generateRandomNickname(): string {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 10000);
    return `${adj}的${noun}${num}`;
  }

  generateRandomAvatar(): Buffer {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    const textColor = '#FFFFFF';
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="60" fill="${bgColor}"/>
      <text x="60" y="72" font-size="48" font-family="sans-serif" fill="${textColor}" text-anchor="middle">
        ${adjectives[Math.floor(Math.random() * adjectives.length)][0]}
      </text>
    </svg>`;
    
    return Buffer.from(svg, 'utf-8');
  }

  async login(code: string, nickName?: string, avatarUrl?: string) {
    console.log('Login with code:', code, 'nickName:', nickName, 'avatarUrl:', avatarUrl);
    
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
        
        let finalNickName = nickName || this.generateRandomNickname();
        let finalAvatarUrl = avatarUrl || null;
        
        if (!avatarUrl) {
          try {
            const avatarBuffer = this.generateRandomAvatar();
            finalAvatarUrl = await this.storageService.uploadFile(avatarBuffer, `avatar_${openid}.svg`, 'image/svg+xml');
            console.log('Generated and uploaded random avatar:', finalAvatarUrl);
          } catch (error) {
            console.error('Failed to upload random avatar:', error);
          }
        }
        
        const result = await db.insert(users).values({
          openid,
          nickName: finalNickName,
          avatarUrl: finalAvatarUrl || null,
        }).returning();
        user = result;
      } else {
        console.log('User exists, updating profile:', openid);
        
        let updateData: any = {};
        if (nickName) {
          updateData.nickName = nickName;
        }
        
        if (avatarUrl && !avatarUrl.startsWith('wxfile://')) {
          updateData.avatarUrl = avatarUrl;
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          const result = await db.update(users).set(updateData).where(eq(users.openid, openid)).returning();
          user = result;
        }
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
        
        let finalNickName = nickName || this.generateRandomNickname();
        let finalAvatarUrl = avatarUrl || null;
        
        if (!avatarUrl) {
          try {
            const avatarBuffer = this.generateRandomAvatar();
            finalAvatarUrl = await this.storageService.uploadFile(avatarBuffer, `avatar_${openid}.svg`, 'image/svg+xml');
          } catch (error) {
            console.error('Failed to upload random avatar:', error);
          }
        }
        
        const result = await db.insert(users).values({
          openid,
          nickName: finalNickName,
          avatarUrl: finalAvatarUrl || null,
        }).returning();
        user = result;
      } else if (nickName || avatarUrl) {
        const updateData: any = {};
        if (nickName) updateData.nickName = nickName;
        if (avatarUrl && !avatarUrl.startsWith('wxfile://')) {
          updateData.avatarUrl = avatarUrl;
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          const result = await db.update(users).set(updateData).where(eq(users.openid, openid)).returning();
          user = result;
        }
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