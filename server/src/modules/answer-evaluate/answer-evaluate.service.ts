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
  }> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的答题评估助手。请根据以下信息对用户的简答题答案进行评估：

评估要求：
1. 根据标准答案对用户答案进行打分（0-100分）
2. 分析用户答案与标准答案之间的差异，指出用户回答中的优点和不足
3. 提供详细的AI解析，帮助用户理解正确答案并提升答题能力

输出格式（JSON）：
{
  "score": 分数（0-100）,
  "aiAnalysis": "详细的AI解析，包括差距分析、优点、不足和改进建议"
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

      let result: { score: number; aiAnalysis: string } = {
        score: 0,
        aiAnalysis: '解析失败',
      };

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          result.score = parsed.score || 0;
          result.aiAnalysis = parsed.aiAnalysis || parsed.gapAnalysis || parsed.analysis || content;
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
      };
    }
  }
}