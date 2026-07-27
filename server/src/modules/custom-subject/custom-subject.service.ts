import { Injectable } from '@nestjs/common';
import { db } from '@/db/db.module';
import { customSubjects, questions, subjects, users } from '@/db/schema';
import { eq, and, count, or } from 'drizzle-orm';
import { LLMClient } from 'coze-coding-dev-sdk';

@Injectable()
export class CustomSubjectService {
  private llmClient: LLMClient;

  constructor() {
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

  async parseFileToQuestions(fileContent: string, subjectId: string, subjectName: string): Promise<any[]> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的题目解析助手。请将以下文本内容解析为结构化的题目数据。

题目类型支持：
- choice: 选择题（包含多个选项和正确答案）
- judge: 判断题（正确或错误）
- short: 简答题（需要文字回答）

输出格式必须是严格的JSON数组，每个题目包含：
{
  "id": "唯一ID",
  "content": "题目内容",
  "type": "题目类型(choice/judge/short)",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "answer": "正确答案（选择题填选项字母，判断题填true/false，简答题填参考答案）",
  "analysis": "题目解析",
  "difficulty": "难度(easy/medium/hard)"
}

请根据题目内容自动判断难度：简单题目选easy，中等难度选medium，复杂题目选hard。`,
        },
        {
          role: 'user' as const,
          content: fileContent,
        },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-lite-260215',
      });
      const content = response.content || '';

      let parsedQuestions: any[] = [];
      try {
        const jsonMatch = content.match(/\[.*\]/s);
        if (jsonMatch) {
          parsedQuestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse LLM response:', e);
      }

      const existingQuestions = await db.select({ content: questions.content }).from(questions).where(eq(questions.subjectId, subjectId));
      const existingContents = new Set(existingQuestions.map((q) => q.content.trim()));

      const filteredQuestions = parsedQuestions.filter((q) => {
        return q.content && !existingContents.has(q.content.trim());
      });

      const finalQuestions = filteredQuestions.map((q) => ({
        ...q,
        id: 'q_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
        subjectId,
        subjectName,
        createdAt: new Date().toISOString(),
      }));

      return finalQuestions;
    } catch (error) {
      console.error('LLM parsing error:', error);
      return [];
    }
  }

  async importQuestions(questionsData: any[], subjectId: string) {
    if (questionsData.length === 0) {
      return { count: 0 };
    }

    await db.insert(questions).values(questionsData);

    const countResult = await db.select({ count: count() }).from(questions).where(eq(questions.subjectId, subjectId));
    
    await db.update(subjects)
      .set({ questionCount: countResult[0].count || 0 })
      .where(eq(subjects.id, subjectId));

    return { count: questionsData.length };
  }

  async deleteCustomSubject(userId: number, subjectId: string) {
    await db.delete(customSubjects).where(and(eq(customSubjects.id, subjectId), eq(customSubjects.userId, userId)));
    await db.delete(questions).where(eq(questions.subjectId, subjectId));
    await db.delete(subjects).where(eq(subjects.id, subjectId));
    
    return { success: true };
  }
}