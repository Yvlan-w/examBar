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
3. 提供详细的AI解析，使用Markdown格式，包括差距分析、优点、不足和改进建议

输出格式（JSON，严格按此格式，不要添加其他内容）：
\`\`\`json
{
  "score": 分数（0-100的整数）,
  "aiAnalysis": "使用Markdown格式的详细AI解析，包括差距分析、优点、不足和改进建议"
}
\`\`\``,
        },
        {
          role: 'user' as const,
          content: `题目：${question}

标准答案：${correctAnswer}

用户答案：${userAnswer}`,
        },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-mini-260215',
      });

      const content = response.content || '';
      console.log('[AnswerEvaluate] 原始返回:', content.substring(0, 200));

      const result = this.parseEvaluationResponse(content);
      console.log('[AnswerEvaluate] 解析结果:', { score: result.score, aiAnalysisLength: result.aiAnalysis.length });

      return result;
    } catch (error) {
      console.error('LLM evaluation error:', error);
      return {
        score: 0,
        aiAnalysis: 'AI解析服务暂时不可用',
      };
    }
  }

  /**
   * 解析LLM返回的评估响应
   * 处理多种可能的格式：纯JSON、markdown代码块包裹的JSON、或直接文本
   */
  private parseEvaluationResponse(content: string): { score: number; aiAnalysis: string } {
    let result: { score: number; aiAnalysis: string } = {
      score: 0,
      aiAnalysis: '解析失败',
    };

    // 尝试多种方式解析JSON
    const jsonStr = this.extractJson(content);
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        result.score = typeof parsed.score === 'number' ? parsed.score : 0;
        result.aiAnalysis = parsed.aiAnalysis || parsed.analysis || parsed.gapAnalysis || '';
        
        // 如果 aiAnalysis 为空，尝试用其他字段
        if (!result.aiAnalysis) {
          result.aiAnalysis = parsed.explanation || parsed.reason || '';
        }
      } catch (e) {
        console.warn('[AnswerEvaluate] JSON解析失败，尝试提取文本:', e);
        result.aiAnalysis = content;
      }
    } else {
      // 无法解析JSON，返回原文
      result.aiAnalysis = content;
    }

    // 确保分数在0-100范围内
    if (result.score < 0) result.score = 0;
    if (result.score > 100) result.score = 100;

    return result;
  }

  /**
   * 从LLM响应中提取JSON字符串
   * 支持多种格式：纯JSON、markdown代码块、或带说明文本的JSON
   */
  private extractJson(content: string): string | null {
    // 1. 尝试从 markdown 代码块中提取 (```json ... ```)
    const codeBlockMatch = content.match(/```json\s*\n?([\s\S]*?)\n?\s*```/i);
    if (codeBlockMatch) {
      console.log('[AnswerEvaluate] 从代码块提取JSON');
      return codeBlockMatch[1].trim();
    }

    // 2. 尝试提取第一个完整的JSON对象
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // 验证是否是有效JSON
      try {
        JSON.parse(jsonMatch[0]);
        console.log('[AnswerEvaluate] 提取到有效JSON对象');
        return jsonMatch[0];
      } catch {
        console.log('[AnswerEvaluate] 正则提取的内容不是有效JSON，尝试修复');
      }
    }

    // 3. 尝试逐字符构建有效JSON（处理可能的格式问题）
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = content.substring(firstBrace, lastBrace + 1);
      try {
        JSON.parse(candidate);
        console.log('[AnswerEvaluate] 通过括号匹配提取JSON');
        return candidate;
      } catch {
        console.log('[AnswerEvaluate] 括号匹配的JSON无效');
      }
    }

    return null;
  }
}