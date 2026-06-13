/**
 * 任务草稿服务
 *
 * 处理任务草稿的创建、编辑、保存、发布等功能
 */

import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

// =====================================================
// 类型定义
// =====================================================

export interface TaskDraft {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements?: string;
  deliverables?: string;
  category?: string;
  tags?: string[];
  budget_min?: number;
  budget_max?: number;
  deadline?: Date;
  estimated_hours?: number;
  required_abilities?: any[];
  difficulty_level?: string;
  attachments?: any[];
  draft_status: string;
  completion_percentage: number;
  ai_suggestions?: any;
  ai_pricing_suggestion?: any;
  last_ai_review_at?: Date;
  version: number;
  parent_draft_id?: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  published_task_id?: string;
}

export interface CreateDraftParams {
  company_id: string;
  title: string;
  description?: string;
  requirements?: string;
  deliverables?: string;
  category?: string;
  tags?: string[];
  budget_min?: number;
  budget_max?: number;
  deadline?: Date;
  estimated_hours?: number;
  required_abilities?: any[];
  difficulty_level?: string;
  attachments?: any[];
}

export interface UpdateDraftParams {
  title?: string;
  description?: string;
  requirements?: string;
  deliverables?: string;
  category?: string;
  tags?: string[];
  budget_min?: number;
  budget_max?: number;
  deadline?: Date;
  estimated_hours?: number;
  required_abilities?: any[];
  difficulty_level?: string;
  attachments?: any[];
  draft_status?: string;
}

export interface AISuggestion {
  title_suggestions?: string[];
  description_improvements?: string[];
  requirement_clarifications?: string[];
  deliverable_suggestions?: string[];
  missing_information?: string[];
  overall_score: number;
  readiness: 'not_ready' | 'needs_improvement' | 'ready';
}

export interface AIPricingSuggestion {
  suggested_min: number;
  suggested_max: number;
  reasoning: string;
  market_comparison: string;
  complexity_score: number;
  time_estimate_hours: number;
}

// =====================================================
// 草稿服务类
// =====================================================

class TaskDraftService {
  /**
   * 创建新草稿
   */
  async createDraft(params: CreateDraftParams): Promise<TaskDraft> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO task_drafts (
          company_id, title, description, requirements, deliverables,
          category, tags, budget_min, budget_max, deadline,
          estimated_hours, required_abilities, difficulty_level, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          params.company_id,
          params.title,
          params.description || '',
          params.requirements,
          params.deliverables,
          params.category,
          params.tags,
          params.budget_min,
          params.budget_max,
          params.deadline,
          params.estimated_hours,
          params.required_abilities ? JSON.stringify(params.required_abilities) : null,
          params.difficulty_level,
          params.attachments ? JSON.stringify(params.attachments) : null,
        ]
      );

      logger.info('Draft created', { draftId: result.rows[0].id, companyId: params.company_id });

      return result.rows[0];
    } catch (error: unknown) {
      logger.error('Failed to create draft', { error, params });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新草稿
   */
  async updateDraft(draftId: string, companyId: string, params: UpdateDraftParams): Promise<TaskDraft> {
    const client = await pool.connect();

    try {
      // 构建动态更新语句
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = $${paramIndex}`);

          // 特殊处理JSON字段
          if (['tags', 'required_abilities', 'attachments'].includes(key)) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }

          paramIndex++;
        }
      });

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(draftId);
      values.push(companyId);

      const result = await client.query(
        `UPDATE task_drafts
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Draft not found or unauthorized');
      }

      logger.info('Draft updated', { draftId, companyId });

      return result.rows[0];
    } catch (error: unknown) {
      logger.error('Failed to update draft', { error, draftId, params });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取草稿详情
   */
  async getDraft(draftId: string, companyId: string): Promise<TaskDraft | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT * FROM task_drafts WHERE id = $1 AND company_id = $2`,
        [draftId, companyId]
      );

      return result.rows[0] || null;
    } catch (error: unknown) {
      logger.error('Failed to get draft', { error, draftId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取企业的所有草稿
   */
  async getDrafts(
    companyId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ drafts: TaskDraft[]; total: number }> {
    const client = await pool.connect();

    try {
      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;

      let whereClause = 'WHERE company_id = $1';
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (filters?.status) {
        whereClause += ` AND draft_status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      // 获取总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM task_drafts ${whereClause}`,
        params
      );

      // 获取草稿列表
      const result = await client.query(
        `SELECT * FROM task_drafts
         ${whereClause}
         ORDER BY updated_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      return {
        drafts: result.rows,
        total: parseInt(countResult.rows[0].count),
      };
    } catch (error: unknown) {
      logger.error('Failed to get drafts', { error, companyId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除草稿
   */
  async deleteDraft(draftId: string, companyId: string): Promise<void> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `DELETE FROM task_drafts WHERE id = $1 AND company_id = $2`,
        [draftId, companyId]
      );

      if (result.rowCount === 0) {
        throw new Error('Draft not found or unauthorized');
      }

      logger.info('Draft deleted', { draftId, companyId });
    } catch (error: unknown) {
      logger.error('Failed to delete draft', { error, draftId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 复制草稿
   */
  async duplicateDraft(draftId: string, companyId: string): Promise<TaskDraft> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO task_drafts (
          company_id, title, description, requirements, deliverables,
          category, tags, budget_min, budget_max, deadline,
          estimated_hours, required_abilities, difficulty_level, attachments,
          parent_draft_id
        )
        SELECT
          company_id, title || ' (副本)', description, requirements, deliverables,
          category, tags, budget_min, budget_max, deadline,
          estimated_hours, required_abilities, difficulty_level, attachments,
          $1
        FROM task_drafts
        WHERE id = $1 AND company_id = $2
        RETURNING *`,
        [draftId, companyId]
      );

      if (result.rows.length === 0) {
        throw new Error('Draft not found or unauthorized');
      }

      logger.info('Draft duplicated', { originalId: draftId, newId: result.rows[0].id });

      return result.rows[0];
    } catch (error: unknown) {
      logger.error('Failed to duplicate draft', { error, draftId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * AI审核草稿并给出建议
   */
  async reviewDraftWithAI(draftId: string, companyId: string): Promise<AISuggestion> {
    const client = await pool.connect();

    try {
      // 获取草稿
      const draft = await this.getDraft(draftId, companyId);
      if (!draft) {
        throw new Error('Draft not found');
      }

      // 构建AI prompt
      const prompt = `你是一个专业的任务需求分析师。请审核以下任务草稿，并给出改进建议。

任务标题：${draft.title}
任务描述：${draft.description || '（未填写）'}
具体要求：${draft.requirements || '（未填写）'}
交付物：${draft.deliverables || '（未填写）'}
预算范围：${draft.budget_min || '未设置'} - ${draft.budget_max || '未设置'} 元
截止日期：${draft.deadline || '未设置'}
难度等级：${draft.difficulty_level || '未设置'}

请以JSON格式返回分析结果：
{
  "title_suggestions": ["标题改进建议1", "建议2"],
  "description_improvements": ["描述改进建议"],
  "requirement_clarifications": ["需要澄清的要求"],
  "deliverable_suggestions": ["交付物建议"],
  "missing_information": ["缺失的关键信息"],
  "overall_score": 85,
  "readiness": "ready"
}

readiness可选值：not_ready（完成度<60%）、needs_improvement（60-80%）、ready（>80%）`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // 提取JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const aiSuggestion: AISuggestion = JSON.parse(jsonMatch[0]);

      // 保存AI建议到草稿
      await client.query(
        `UPDATE task_drafts
         SET ai_suggestions = $1, last_ai_review_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(aiSuggestion), draftId]
      );

      logger.info('Draft reviewed by AI', { draftId, score: aiSuggestion.overall_score });

      return aiSuggestion;
    } catch (error: unknown) {
      logger.error('Failed to review draft with AI', { error, draftId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * AI智能定价建议
   */
  async getPricingSuggestion(draftId: string, companyId: string): Promise<AIPricingSuggestion> {
    const client = await pool.connect();

    try {
      const draft = await this.getDraft(draftId, companyId);
      if (!draft) {
        throw new Error('Draft not found');
      }

      const prompt = `你是一个专业的任务定价顾问。请根据以下任务信息，给出合理的价格建议。

任务标题：${draft.title}
任务描述：${draft.description}
具体要求：${draft.requirements || '无'}
交付物：${draft.deliverables || '无'}
难度等级：${draft.difficulty_level || '未知'}
预计工时：${draft.estimated_hours || '未知'} 小时

请以JSON格式返回定价建议：
{
  "suggested_min": 500,
  "suggested_max": 800,
  "reasoning": "基于任务复杂度和市场行情的定价理由",
  "market_comparison": "与市场同类任务的对比",
  "complexity_score": 75,
  "time_estimate_hours": 10
}`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to parse AI pricing response');
      }

      const pricingSuggestion: AIPricingSuggestion = JSON.parse(jsonMatch[0]);

      // 保存定价建议
      await client.query(
        `UPDATE task_drafts
         SET ai_pricing_suggestion = $1
         WHERE id = $2`,
        [JSON.stringify(pricingSuggestion), draftId]
      );

      logger.info('Pricing suggestion generated', { draftId, suggestedRange: `${pricingSuggestion.suggested_min}-${pricingSuggestion.suggested_max}` });

      return pricingSuggestion;
    } catch (error: unknown) {
      logger.error('Failed to get pricing suggestion', { error, draftId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 发布草稿为正式任务
   */
  async publishDraft(draftId: string, companyId: string): Promise<string> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 验证草稿所有权
      const draft = await this.getDraft(draftId, companyId);
      if (!draft) {
        throw new Error('Draft not found or unauthorized');
      }

      // 调用数据库函数发布草稿
      const result = await client.query(
        `SELECT publish_draft_to_task($1) as task_id`,
        [draftId]
      );

      const taskId = result.rows[0].task_id;

      await client.query('COMMIT');

      logger.info('Draft published', { draftId, taskId, companyId });

      return taskId;
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      logger.error('Failed to publish draft', { error, draftId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取草稿历史版本
   */
  async getDraftHistory(draftId: string, companyId: string, limit: number = 10): Promise<any[]> {
    const client = await pool.connect();

    try {
      // 验证所有权
      const draft = await this.getDraft(draftId, companyId);
      if (!draft) {
        throw new Error('Draft not found or unauthorized');
      }

      const result = await client.query(
        `SELECT id, changed_fields, change_summary, created_at
         FROM task_draft_history
         WHERE draft_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [draftId, limit]
      );

      return result.rows;
    } catch (error: unknown) {
      logger.error('Failed to get draft history', { error, draftId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 恢复到历史版本
   */
  async restoreDraftVersion(draftId: string, companyId: string, historyId: string): Promise<TaskDraft> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 验证所有权
      const draft = await this.getDraft(draftId, companyId);
      if (!draft) {
        throw new Error('Draft not found or unauthorized');
      }

      // 获取历史快照
      const historyResult = await client.query(
        `SELECT snapshot FROM task_draft_history WHERE id = $1 AND draft_id = $2`,
        [historyId, draftId]
      );

      if (historyResult.rows.length === 0) {
        throw new Error('History version not found');
      }

      const snapshot = historyResult.rows[0].snapshot;

      // 恢复草稿（保留id和company_id）
      const result = await client.query(
        `UPDATE task_drafts
         SET title = $1,
             description = $2,
             requirements = $3,
             deliverables = $4,
             category = $5,
             tags = $6,
             budget_min = $7,
             budget_max = $8,
             deadline = $9,
             estimated_hours = $10,
             required_abilities = $11,
             difficulty_level = $12,
             attachments = $13,
             version = version + 1,
             updated_at = NOW()
         WHERE id = $14 AND company_id = $15
         RETURNING *`,
        [
          snapshot.title,
          snapshot.description,
          snapshot.requirements,
          snapshot.deliverables,
          snapshot.category,
          snapshot.tags,
          snapshot.budget_min,
          snapshot.budget_max,
          snapshot.deadline,
          snapshot.estimated_hours,
          snapshot.required_abilities,
          snapshot.difficulty_level,
          snapshot.attachments,
          draftId,
          companyId,
        ]
      );

      await client.query('COMMIT');

      logger.info('Draft restored to version', { draftId, historyId });

      return result.rows[0];
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      logger.error('Failed to restore draft version', { error, draftId, historyId });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const taskDraftService = new TaskDraftService();
