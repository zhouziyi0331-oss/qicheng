/**
 * AI任务拆解服务 - E-01功能
 * 将企业的模糊需求拆解为具体的子任务
 * 提供价格和工期建议
 */

import Anthropic from '@anthropic-ai/sdk';
import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';
import { config } from '../../config';

interface SubTask {
  id: string;
  title: string;
  description: string;
  skills: string[];
  difficulty: number;
  estimatedHours: number;
  estimatedCost: {
    min: number;
    max: number;
  };
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
}

interface BreakdownResult {
  subtasks: SubTask[];
  totalCost: {
    min: number;
    max: number;
    recommended: number;
  };
  totalDays: {
    min: number;
    max: number;
    recommended: number;
  };
  requiredSkills: string[];
  riskWarnings: string[];
  recommendations: string[];
}

interface BreakdownOptions {
  userId?: string;
  additionalContext?: any;
}

class TaskBreakdownService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }

  /**
   * 拆解任务需求
   */
  async breakdownTask(rawDescription: string, options: BreakdownOptions = {}): Promise<BreakdownResult> {
    const startTime = Date.now();

    try {
      console.log('[taskBreakdownService] 开始拆解任务');
      console.log('[taskBreakdownService] API Key存在:', !!process.env.ANTHROPIC_API_KEY);
      console.log('[taskBreakdownService] API Key长度:', process.env.ANTHROPIC_API_KEY?.length || 0);

      logger.info('Breaking down task:', { rawDescription: rawDescription.substring(0, 100) });

      const prompt = this.buildBreakdownPrompt(rawDescription, options.additionalContext);

      console.log('[taskBreakdownService] 调用Claude API...');
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      console.log('[taskBreakdownService] API调用成功，tokens:', response.usage);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // 解析JSON响应
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Claude response');
      }

      const breakdown = JSON.parse(jsonMatch[0]);

      // 构建标准化的结果
      const result: BreakdownResult = {
        subtasks: this.normalizeSubtasks(breakdown.subtasks || []),
        totalCost: breakdown.totalCost || { min: 0, max: 0, recommended: 0 },
        totalDays: breakdown.totalDays || { min: 0, max: 0, recommended: 0 },
        requiredSkills: breakdown.requiredSkills || [],
        riskWarnings: breakdown.riskWarnings || [],
        recommendations: breakdown.recommendations || [],
      };

      const processingTime = Date.now() - startTime;

      logger.info('Task breakdown completed', {
        subtasksCount: result.subtasks.length,
        processingTime,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      });

      return result;
    } catch (error: unknown) {
      console.error('[taskBreakdownService] AI拆解失败:', error);
      console.error('[taskBreakdownService] 错误详情:', error instanceof Error ? error.message : String(error));
      logger.error('Error breaking down task:', error);
      // 返回降级结果
      return this.createFallbackBreakdown(rawDescription);
    }
  }

  /**
   * 构建AI拆解提示词
   */
  private buildBreakdownPrompt(rawDescription: string, additionalContext?: any): string {
    return `你是启程平台的"AI需求分析师"，帮助企业将模糊的需求拆解为具体的子任务。

企业需求描述：
${rawDescription}

${additionalContext ? `补充信息：\n${JSON.stringify(additionalContext, null, 2)}` : ''}

请完成以下任务拆解，以JSON格式返回：

{
  "subtasks": [
    {
      "id": "st_1",
      "title": "子任务标题（简短清晰）",
      "description": "详细描述这个子任务需要做什么",
      "skills": ["React", "Node.js"],  // 需要的技能
      "difficulty": 3,  // 难度1-5
      "estimatedHours": 16,  // 预估工时（小时）
      "estimatedCost": {
        "min": 800,  // 最低价格（元）
        "max": 1200  // 最高价格（元）
      },
      "priority": "high",  // high/medium/low
      "dependencies": []  // 依赖的其他子任务ID
    }
  ],
  "totalCost": {
    "min": 总最低价格,
    "max": 总最高价格,
    "recommended": 建议价格（中位数）
  },
  "totalDays": {
    "min": 最短工期（天），
    "max": 最长工期（天），
    "recommended": 建议工期（天）
  },
  "requiredSkills": ["所有需要的技能列表"],
  "riskWarnings": ["风险提示，如'需求过于复杂'"],
  "recommendations": ["建议，如'建议先做MVP版本'"]
}

拆解原则：
1. 拆解为3-7个子任务（太少不够细，太多太碎）
2. 每个子任务应该是独立的、可交付的模块
3. 价格基于市场行情：初级开发50元/小时，中级80元/小时，高级120元/小时
4. 工期考虑串行和并行：有依赖的串行，无依赖可并行
5. 识别风险：技术难度高、需求不清晰、时间紧迫等
6. 给出实用建议：优先级、MVP、分期等

请返回完整的JSON对象。`;
  }

  /**
   * 标准化子任务格式
   */
  private normalizeSubtasks(subtasks: any[]): SubTask[] {
    return subtasks.map((st, index) => ({
      id: st.id || `st_${index + 1}`,
      title: st.title || '未命名子任务',
      description: st.description || '',
      skills: Array.isArray(st.skills) ? st.skills : [],
      difficulty: Math.min(Math.max(st.difficulty || 3, 1), 5),
      estimatedHours: st.estimatedHours || 8,
      estimatedCost: {
        min: st.estimatedCost?.min || 0,
        max: st.estimatedCost?.max || 0,
      },
      priority: st.priority || 'medium',
      dependencies: Array.isArray(st.dependencies) ? st.dependencies : [],
    }));
  }

  /**
   * 创建降级拆解结果（当AI失败时）
   */
  private createFallbackBreakdown(rawDescription: string): BreakdownResult {
    return {
      subtasks: [{
        id: 'st_1',
        title: '主要任务',
        description: rawDescription,
        skills: [],
        difficulty: 3,
        estimatedHours: 40,
        estimatedCost: { min: 2000, max: 4000 },
        priority: 'high',
        dependencies: [],
      }],
      totalCost: { min: 2000, max: 4000, recommended: 3000 },
      totalDays: { min: 5, max: 10, recommended: 7 },
      requiredSkills: [],
      riskWarnings: ['AI拆解失败，使用默认估算'],
      recommendations: ['建议提供更详细的需求描述'],
    };
  }

  /**
   * 保存拆解结果到数据库
   */
  async saveBreakdownResult(
    taskId: string,
    rawDescription: string,
    result: BreakdownResult,
    options: BreakdownOptions = {}
  ): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新tasks表
      await client.query(
        `UPDATE tasks SET
          breakdown_result = $1,
          ai_suggested_price = $2,
          ai_suggested_min_price = $3,
          ai_suggested_max_price = $4,
          ai_suggested_days = $5,
          ai_suggested_min_days = $6,
          ai_suggested_max_days = $7,
          breakdown_created_at = NOW(),
          breakdown_version = COALESCE(breakdown_version, 0) + 1
        WHERE id = $8`,
        [
          JSON.stringify(result),
          result.totalCost.recommended,
          result.totalCost.min,
          result.totalCost.max,
          result.totalDays.recommended,
          result.totalDays.min,
          result.totalDays.max,
          taskId,
        ]
      );

      // 插入历史记录
      const historyResult = await client.query(
        `INSERT INTO task_breakdown_history (
          task_id, raw_description, additional_context,
          breakdown_result, subtasks,
          suggested_price_range, suggested_days_range,
          required_skills, risk_warnings,
          ai_model, ai_temperature, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          taskId,
          rawDescription,
          JSON.stringify(options.additionalContext || {}),
          JSON.stringify(result),
          JSON.stringify(result.subtasks),
          JSON.stringify(result.totalCost),
          JSON.stringify(result.totalDays),
          JSON.stringify(result.requiredSkills),
          JSON.stringify(result.riskWarnings),
          'claude-3-5-sonnet-20241022',
          0.7,
          options.userId,
        ]
      );

      await client.query('COMMIT');

      logger.info('Saved breakdown result', { taskId, historyId: historyResult.rows[0].id });

      return historyResult.rows[0].id;
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      logger.error('Error saving breakdown result:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务的拆解结果
   */
  async getBreakdownResult(taskId: string): Promise<BreakdownResult | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT breakdown_result FROM tasks WHERE id = $1',
        [taskId]
      );

      if (result.rows.length === 0 || !result.rows[0].breakdown_result) {
        return null;
      }

      return result.rows[0].breakdown_result as BreakdownResult;
    } finally {
      client.release();
    }
  }

  /**
   * 获取拆解历史
   */
  async getBreakdownHistory(taskId: string, limit: number = 10): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          id, raw_description, breakdown_result,
          subtasks, suggested_price_range, suggested_days_range,
          required_skills, risk_warnings,
          user_accepted, user_feedback, created_at
        FROM task_breakdown_history
        WHERE task_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
        [taskId, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 用户接受拆解结果
   */
  async acceptBreakdown(historyId: string, feedback?: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE task_breakdown_history SET
          user_accepted = true,
          user_feedback = $1
        WHERE id = $2`,
        [feedback, historyId]
      );

      logger.info('User accepted breakdown', { historyId });
    } finally {
      client.release();
    }
  }

  /**
   * 用户修改拆解结果
   */
  async modifyBreakdown(
    historyId: string,
    modifiedResult: Partial<BreakdownResult>
  ): Promise<void> {
    const client = await pool.connect();
    try {
      // 获取原始结果
      const originalResult = await client.query(
        'SELECT breakdown_result FROM task_breakdown_history WHERE id = $1',
        [historyId]
      );

      if (originalResult.rows.length === 0) {
        throw new Error('Breakdown history not found');
      }

      const original = originalResult.rows[0].breakdown_result;
      const modified = { ...original, ...modifiedResult };

      await client.query(
        `UPDATE task_breakdown_history SET
          breakdown_result = $1,
          user_modified = true,
          user_modified_at = NOW()
        WHERE id = $2`,
        [JSON.stringify(modified), historyId]
      );

      logger.info('User modified breakdown', { historyId });
    } finally {
      client.release();
    }
  }

  /**
   * 获取拆解统计
   */
  async getBreakdownStats(days: number = 30): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          COUNT(*) as total_breakdowns,
          COUNT(*) FILTER (WHERE user_accepted = true) as accepted_count,
          COUNT(*) FILTER (WHERE user_modified = true) as modified_count,
          AVG(processing_time_ms) as avg_processing_time,
          AVG(ai_tokens_used) as avg_tokens_used
        FROM task_breakdown_history
        WHERE created_at >= NOW() - INTERVAL '${days} days'`
      );

      const stats = result.rows[0];

      return {
        totalBreakdowns: parseInt(stats.total_breakdowns),
        acceptedCount: parseInt(stats.accepted_count),
        modifiedCount: parseInt(stats.modified_count),
        acceptanceRate: stats.total_breakdowns > 0
          ? (stats.accepted_count / stats.total_breakdowns * 100).toFixed(2)
          : 0,
        avgProcessingTime: Math.round(stats.avg_processing_time || 0),
        avgTokensUsed: Math.round(stats.avg_tokens_used || 0),
      };
    } finally {
      client.release();
    }
  }
}

export default new TaskBreakdownService();
