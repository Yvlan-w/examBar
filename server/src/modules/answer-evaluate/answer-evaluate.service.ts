import { Injectable } from '@nestjs/common';
import { LLMClient } from 'coze-coding-dev-sdk';

@Injectable()
export class AnswerEvaluateService {
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient();
  }

  async evaluateShortAnswer(question: string, userAnswer: string, correctAnswer: string): Promise<{
    score: number;
    aiAnalysis: string;
    gapAnalysis: string;
  }> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的答题评估助手。请根据以下信息对用户的简答题答案进行评估：

评估要求：
1. 根据标准答案对用户答案进行打分（0-100分）
2. 分析用户答案与标准答案之间的差距
3. 提供详细的AI解析，帮助用户理解正确答案

输出格式（JSON）：
{
  "score": 分数（0-100）,
  "aiAnalysis": "详细的AI解析",
  "gapAnalysis": "用户答案与标准答案的差距分析"
}`,
        },
        {
          role: 'user' as const,
          content: `题目：${question}

标准答案：${correctAnswer}

用户答案：${userAnswer}`,
        },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-mini-260428',
      });

      const content = response.content || '';

      let result: { score: number; aiAnalysis: string; gapAnalysis: string } = {
        score: 0,
        aiAnalysis: '解析失败',
        gapAnalysis: '无法分析差距',
      };

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result.aiAnalysis = content;
        }
      } catch (e) {
        result.aiAnalysis = content;
      }

      return result;
    } catch (error) {
      console.error('LLM evaluation error:', error);
      return {
        score: 0,
        aiAnalysis: 'AI解析服务暂时不可用',
        gapAnalysis: '无法分析差距',
      };
    }
  }
}