import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { customSubjects, questions, subjects, users, answerRecords, favoriteRecords, subjectStats } from '@/db/schema';
import { eq, and, count, or, inArray } from 'drizzle-orm';
import { LLMClient } from 'coze-coding-dev-sdk';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CustomSubjectService {
  private llmClient: LLMClient;

  constructor(private readonly storageService: StorageService) {
    this.llmClient = new LLMClient();
  }

  async getUniqueName(name: string, userId: number): Promise<string> {
    const cleanedName = name.replace(/\s*by\s+\S+$/, '').replace(/\s*\(\d+\)$/, '').trim();

    const existing = await db.select({ name: customSubjects.name }).from(customSubjects);
    const existingNames = new Set(existing.map((s) => s.name));

    if (!existingNames.has(name)) {
      return name;
    }

    let counter = 1;
    let newName = `${cleanedName}(${counter})`;
    while (existingNames.has(newName)) {
      counter++;
      newName = `${cleanedName}(${counter})`;
    }

    return newName;
  }

  async createCustomSubject(userId: number, name: string, isPublic: boolean, nickname?: string) {
    const uniqueName = await this.getUniqueName(name, userId);

    const finalName = isPublic && nickname 
      ? `${uniqueName} by ${nickname}` 
      : uniqueName;

    const id = 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    
    const colors = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#06B6D4'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    await db.insert(customSubjects).values({
      id,
      userId,
      name: finalName,
      isPublic,
      color,
    });

    await db.insert(subjects).values({
      id,
      name: finalName,
      color,
      questionCount: 0,
    });

    return { id, name: finalName, isPublic, color };
  }

  async toggleVisibility(userId: number, subjectId: string): Promise<{ success: boolean; isPublic: boolean; name: string }> {
    const subjectResult = await db.select().from(customSubjects).where(and(eq(customSubjects.id, subjectId), eq(customSubjects.userId, userId)));
    
    if (subjectResult.length === 0) {
      return { success: false, isPublic: false, name: '' };
    }

    const subject = subjectResult[0];
    const newIsPublic = !subject.isPublic;

    let newName = subject.name;

    if (newIsPublic) {
      const userResult = await db.select({ nickname: users.nickName }).from(users).where(eq(users.id, userId));
      const nickname = userResult[0]?.nickname || '用户';
      
      if (!newName.includes(`by ${nickname}`)) {
        newName = `${newName} by ${nickname}`;
      }
    } else {
      const cleanedName = newName.replace(/\s*by\s+\S+$/, '').trim();
      newName = cleanedName;
    }

    await db.update(customSubjects)
      .set({ isPublic: newIsPublic, name: newName })
      .where(and(eq(customSubjects.id, subjectId), eq(customSubjects.userId, userId)));

    await db.update(subjects)
      .set({ name: newName })
      .where(eq(subjects.id, subjectId));

    return { success: true, isPublic: newIsPublic, name: newName };
  }

  async getCustomSubjects(userId?: number) {
    const conditions = userId ? [eq(customSubjects.userId, userId)] : [];
    
    const results = await db.select().from(customSubjects).where(and(...conditions));
    
    const subjectsWithCount = await Promise.all(
      results.map(async (subject) => {
        const countResult = await db.select({ count: count() }).from(questions).where(eq(questions.subjectId, subject.id));
        return {
          ...subject,
          questionCount: countResult[0].count || 0,
        };
      })
    );

    return subjectsWithCount;
  }

  async getPublicSubjects() {
    const results = await db.select().from(customSubjects).where(eq(customSubjects.isPublic, true));
    
    const subjectsWithCount = await Promise.all(
      results.map(async (subject) => {
        const countResult = await db.select({ count: count() }).from(questions).where(eq(questions.subjectId, subject.id));
        return {
          ...subject,
          questionCount: countResult[0].count || 0,
        };
      })
    );

    return subjectsWithCount;
  }

  async parseFileToQuestions(
    fileContent: string, 
    subjectId: string, 
    subjectName: string,
    imageUrls?: string[],
    tempFileKeys?: string[],
    nickname: string = 'user'
  ): Promise<{ questions: any[]; tempFileKeys?: string[] }> {
    try {
      console.log('\n=====================================');
      console.log('=== LLM 题目解析流程开始 ===');
      console.log('=====================================');
      console.log('[输入参数] subjectId:', subjectId);
      console.log('[输入参数] subjectName:', subjectName);
      console.log('[输入参数] nickname:', nickname);
      console.log('[输入参数] imageUrls数量:', imageUrls?.length || 0);
      console.log('[输入参数] hasFileContent:', !!fileContent && fileContent.length > 0);
      if (fileContent && fileContent.length > 0) {
        console.log('[输入参数] fileContent长度:', fileContent.length);
        console.log('[输入参数] fileContent前200字符:', fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : ''));
      }
      if (imageUrls && imageUrls.length > 0) {
        imageUrls.forEach((url, index) => {
          console.log(`[输入参数] 图片${index + 1} URL:`, url);
        });
      }

      let userMessageContent: string | { type: 'image_url'; image_url: { url: string; detail?: 'high' | 'low' } }[];
      
      if (imageUrls && imageUrls.length > 0) {
        userMessageContent = imageUrls.map((url) => ({
          type: 'image_url' as const,
          image_url: {
            url,
            detail: 'high' as const,
          },
        }));
      } else {
        userMessageContent = fileContent;
      }

      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的题目解析助手。请将以下文本或图片内容解析为结构化的题目数据。
# 硬性强制输出规则【最高优先级，必须遵守】
1. 最终输出**只能返回纯净JSON**，不要任何前置说明、解释、markdown、注释、换行说明、结束语；不能出现\`\`\`json代码块标记。
2. 严格遵守字段结构，不新增字段、不缺失字段、不修改key名称。

# 题型定义
可选type枚举：choice / judge / short
1. choice 选择题
    options：数组，{"label":"A","content":"选项文本"}，严格沿用原题选项标识
    answer：选项label字符串，例"A"/"B"
2. judge 判断题
    options固定为：[{"label":"A","content":"正确"},{"label":"B","content":"错误"}]
    answer："A"代表正确，"B"代表错误
3. short 简答题
    options：空数组 []
    answer：文字形式参考答案

# 单题字段规范
{
  "content": "完整题干文本，去除多余无关符号",
  "type": "choice | judge | short",
  "options": [],
  "answer": "答案",
  "analysis": "专业解析，阐明原理、考点、易错点；原文无解析则自主生成合理解析",
  "difficulty": "easy | medium | hard"
}

# 难度判定标准
easy：基础概念、记忆类、一眼可判断答案
medium：需要简单理解、对比分析，常规考核题型
hard：综合知识点、计算、易混淆辨析、拓展应用类题目

# 额外业务规则
1. 题干、选项文字做清洗：去除空格、乱码、多余换行；保证文本通顺；
2. 若原始素材缺失标准答案，尽可能基于专业知识给出合理参考答案；无法判断时在analysis注明「原题未提供标准答案，解析仅供参考」；
3. 不要自行编造不存在的题干与选项；识别不到有效题目返回空数组 []。
4. 如果提供了多张图片，请按图片顺序解析所有题目，合并成一个数组返回，不要丢失任何图片中的题目。

模板标准样例：
[
    {
        "content": "关于合规管理说法错误的是？",
        "type": "choice",
        "options": [
            {"label":"A","content":"合规管理需要遵循法律法规"},
            {"label":"B","content":"合规管理不需要遵循法律法规"},
            {"label":"C","content":"合规管理应覆盖所有业务领域"},
            {"label":"D","content":"合规管理需要全员参与"}
        ],
        "answer": "B",
        "analysis": "企业合规管理首要前提就是严格遵守国家各项法律法规，因此B选项表述错误。",
        "difficulty": "easy"
    }
]

`,
        },
        {
          role: 'user' as const,
          content: userMessageContent,
        },
      ];

      console.log('[LLM请求] 消息数量:', messages.length);
      console.log('[LLM请求] 用户消息类型:', Array.isArray(userMessageContent) ? `图片数组(${userMessageContent.length}张)` : '文本');
      if (Array.isArray(userMessageContent)) {
        userMessageContent.forEach((part, index) => {
          console.log(`[LLM请求] 图片${index + 1} URL:`, part.image_url?.url);
        });
      }

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-lite-260215',
      });
      const content = response.content || '';

      console.log('\n[LLM响应] 原始内容长度:', content.length);
      console.log('[LLM响应] 原始内容:', content);

      let parsedQuestions: any[] = [];
      try {
        const jsonMatch = content.match(/\[.*\]/s);
        console.log('[JSON解析] 找到JSON匹配:', !!jsonMatch);
        if (jsonMatch) {
          console.log('[JSON解析] 匹配内容:', jsonMatch[0]);
          parsedQuestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('[JSON解析] 解析失败:', e);
      }

      console.log('[解析结果] 解析出题目数量:', parsedQuestions.length);
      if (parsedQuestions.length > 0) {
        console.log('[解析结果] 第一题:', JSON.stringify(parsedQuestions[0], null, 2));
        if (parsedQuestions.length > 1) {
          console.log('[解析结果] 最后一题:', JSON.stringify(parsedQuestions[parsedQuestions.length - 1], null, 2));
        }
      }

      const existingQuestions = await db.select({ content: questions.content, id: questions.id }).from(questions).where(eq(questions.subjectId, subjectId));
      const existingContents = new Set(existingQuestions.map((q) => q.content.trim()));

      console.log('[去重检查] 题库中已有题目数量:', existingQuestions.length);

      const filteredQuestions = parsedQuestions.filter((q) => {
        return q.content && !existingContents.has(q.content.trim());
      });

      console.log('[去重结果] 去重后题目数量:', filteredQuestions.length);
      console.log('[去重结果] 被过滤的重复题目数量:', parsedQuestions.length - filteredQuestions.length);

      const cleanNickname = nickname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
      const cleanSubjectName = subjectName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').replace(/by\s+\S+$/, '').trim();

      console.log('[ID生成] cleanNickname:', cleanNickname);
      console.log('[ID生成] cleanSubjectName:', cleanSubjectName);

      let maxSequence = 0;
      for (const q of existingQuestions) {
        const idPattern = new RegExp(`^q_${cleanNickname}_${cleanSubjectName}_(\\d+)$`);
        const idMatch = q.id.match(idPattern);
        if (idMatch) {
          const seq = parseInt(idMatch[1], 10);
          if (!isNaN(seq) && seq > maxSequence) {
            maxSequence = seq;
          }
        }
      }

      const finalQuestions = filteredQuestions.map((q, index) => ({
        ...q,
        id: `q_${cleanNickname}_${cleanSubjectName}_${maxSequence + index + 1}`,
        subjectId,
        subjectName,
        createdAt: new Date(),
      }));

      console.log('[ID生成] 最大序列号:', maxSequence);
      console.log('[最终结果] 生成题目数量:', finalQuestions.length);
      if (finalQuestions.length > 0) {
        console.log('[最终结果] 第一题ID:', finalQuestions[0].id);
        console.log('[最终结果] 最后一题ID:', finalQuestions[finalQuestions.length - 1].id);
      }
      console.log('=====================================');
      console.log('=== LLM 题目解析流程结束 ===');
      console.log('=====================================\n');

      return { questions: finalQuestions, tempFileKeys };
    } catch (error) {
      console.error('=====================================');
      console.error('=== LLM 题目解析流程出错 ===');
      console.error('=====================================');
      console.error('[错误]', error);
      console.error('=====================================\n');
      return { questions: [], tempFileKeys };
    }
  }

  async cleanUpTempFiles(keys?: string[]): Promise<void> {
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => this.storageService.deleteFile(key)));
      console.log('[清理] 已删除', keys.length, '个临时文件');
    }
  }

  async importQuestions(questionsData: any[], subjectId: string) {
    if (questionsData.length === 0) {
      return { count: 0 };
    }

    const questionsToInsert = questionsData.map(q => {
      const { createdAt, ...rest } = q;
      return rest;
    });

    await db.insert(questions).values(questionsToInsert);

    const countResult = await db.select({ count: count() }).from(questions).where(eq(questions.subjectId, subjectId));
    
    await db.update(subjects)
      .set({ questionCount: countResult[0].count || 0 })
      .where(eq(subjects.id, subjectId));

    return { count: questionsData.length };
  }

  async deleteCustomSubject(userId: number, subjectId: string) {
    const subjectQuestions = await db.select({ id: questions.id }).from(questions).where(eq(questions.subjectId, subjectId));
    const questionIds = subjectQuestions.map(q => q.id);

    if (questionIds.length > 0) {
      await db.delete(answerRecords).where(inArray(answerRecords.questionId, questionIds));
      await db.delete(favoriteRecords).where(inArray(favoriteRecords.questionId, questionIds));
    }

    await db.delete(subjectStats).where(eq(subjectStats.subjectId, subjectId));
    await db.delete(questions).where(eq(questions.subjectId, subjectId));
    await db.delete(customSubjects).where(and(eq(customSubjects.id, subjectId), eq(customSubjects.userId, userId)));
    await db.delete(subjects).where(eq(subjects.id, subjectId));
    
    return { success: true };
  }
}