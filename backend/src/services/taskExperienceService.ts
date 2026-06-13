import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

const anthropic = new Anthropic({
  apiKey: config.ai.anthropicApiKey,
});

interface TaskDraft {
  company_id: string;
  title?: string;
  description?: string;
  category?: string;
  required_skills?: string[];
  budget?: number;
  deadline?: Date;
  requirements?: string[];
  deliverables?: string[];
  is_template?: boolean;
  template_name?: string;
}

interface BudgetSuggestionParams {
  task_category: string;
  task_description?: string;
  required_skills?: string[];
  quality_expectation?: 'basic' | 'standard' | 'premium';
}

/**
 * E-01a, E-01b, E-01d: 任务发布体验优化服务
 */
class TaskExperienceService {
  /**
   * E-01d: 保存任务草稿
   */
  async saveDraft(data: TaskDraft): Promise<any> {
    const {
      company_id,
      title,
      description,
      category,
      required_skills,
      budget,
      deadline,
      requirements,
      deliverables,
      is_template,
      template_name,
    } = data;

    const result = await pool.query(
      `INSERT INTO task_drafts
       (id, company_id, title, description, category, required_skills, budget, deadline,
        requirements, deliverables, is_template, template_name, last_edited_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [
        uuidv4(),
        company_id,
        title,
        description,
        category,
        required_skills || [],
        budget,
        deadline,
        requirements || [],
        deliverables || [],
        is_template || false,
        template_name,
      ]
    );

    return result.rows[0];
  }

  /**
   * 更新草稿
   */
  async updateDraft(draftId: string, companyId: string, updates: Partial<TaskDraft>): Promise<any> {
    const allowedFields = [
      'title',
      'description',
      'category',
      'required_skills',
      'budget',
      'deadline',
      'requirements',
      'deliverables',
      'is_template',
      'template_name',
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有可更新的字段');
    }

    fields.push(`last_edited_at = NOW()`);
    values.push(draftId, companyId);

    const query = `
      UPDATE task_drafts
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND company_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('草稿不存在');
    }

    return result.rows[0];
  }

  /**
   * 获取草稿列表
   */
  async getDrafts(companyId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM task_drafts WHERE company_id = $1 ORDER BY last_edited_at DESC`,
      [companyId]
    );

    return result.rows;
  }

  /**
   * 删除草稿
   */
  async deleteDraft(draftId: string, companyId: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM task_drafts WHERE id = $1 AND company_id = $2`,
      [draftId, companyId]
    );

    if (result.rowCount === 0) {
      throw new Error('草稿不存在');
    }
  }

  /**
   * 从草稿创建任务
   */
  async publishFromDraft(draftId: string, companyId: string): Promise<any> {
    const draft = await pool.query(
      `SELECT * FROM task_drafts WHERE id = $1 AND company_id = $2`,
      [draftId, companyId]
    );

    if (draft.rows.length === 0) {
      throw new Error('草稿不存在');
    }

    return draft.rows[0];
  }

  /**
   * E-01a: 获取任务模板列表
   */
  async getTemplates(category?: string): Promise<any[]> {
    let query = `SELECT * FROM task_templates WHERE is_active = true`;
    const params: any[] = [];

    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY usage_count DESC, created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 获取模板详情
   */
  async getTemplateById(templateId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM task_templates WHERE id = $1 AND is_active = true`,
      [templateId]
    );

    if (result.rows.length === 0) {
      throw new Error('模板不存在');
    }

    return result.rows[0];
  }

  /**
   * 使用模板创建草稿
   */
  async createDraftFromTemplate(templateId: string, companyId: string, customData?: any): Promise<any> {
    const template = await this.getTemplateById(templateId);

    // 记录模板使用
    await pool.query(
      `INSERT INTO template_usage (id, template_id, company_id) VALUES ($1, $2, $3)`,
      [uuidv4(), templateId, companyId]
    );

    // 创建草稿
    const draft = await this.saveDraft({
      company_id: companyId,
      title: template.title_template,
      description: template.description_template,
      category: template.category,
      required_skills: template.required_skills,
      budget: customData?.budget || template.typical_budget_min,
      requirements: template.requirements_template,
      deliverables: template.deliverables_template,
      ...customData,
    });

    return draft;
  }

  /**
   * E-01b: 智能预算建议
   */
  async suggestBudget(params: BudgetSuggestionParams, companyId: string): Promise<any> {
    const { task_category, task_description, required_skills, quality_expectation } = params;

    // 1. 查询历史数据
    const similarTasks = await pool.query(
      `SELECT budget, client_rating, status
       FROM tasks
       WHERE category = $1
         AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 100`,
      [task_category]
    );

    const budgets = similarTasks.rows.map((t) => parseFloat(t.budget));

    if (budgets.length === 0) {
      // 没有历史数据，返回默认建议
      return {
        suggested_min: 200,
        suggested_max: 500,
        suggested_optimal: 300,
        similar_tasks_count: 0,
        reasoning: '该类型任务暂无历史数据，以下是平台通用建议',
      };
    }

    // 2. 计算分位数
    budgets.sort((a, b) => a - b);
    const p25 = budgets[Math.floor(budgets.length * 0.25)];
    const p50 = budgets[Math.floor(budgets.length * 0.5)];
    const p75 = budgets[Math.floor(budgets.length * 0.75)];

    // 3. 根据质量期望调整
    let suggestedMin = p25;
    let suggestedMax = p75;
    let suggestedOptimal = p50;

    if (quality_expectation === 'basic') {
      suggestedMin = p25 * 0.9;
      suggestedOptimal = p25;
      suggestedMax = p50;
    } else if (quality_expectation === 'premium') {
      suggestedMin = p50;
      suggestedOptimal = p75;
      suggestedMax = p75 * 1.2;
    }

    // 4. 使用AI生成reasoning
    const reasoning = await this.generateBudgetReasoning(
      task_category,
      similarTasks.rows.length,
      suggestedOptimal,
      quality_expectation || 'standard'
    );

    // 5. 保存建议记录
    const result = await pool.query(
      `INSERT INTO budget_suggestions
       (id, company_id, task_category, task_description, required_skills, quality_expectation,
        suggested_min, suggested_max, suggested_optimal, similar_tasks_count,
        similar_tasks_avg_budget, market_data, reasoning)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        uuidv4(),
        companyId,
        task_category,
        task_description,
        required_skills || [],
        quality_expectation || 'standard',
        suggestedMin,
        suggestedMax,
        suggestedOptimal,
        similarTasks.rows.length,
        p50,
        JSON.stringify({ p25, p50, p75 }),
        reasoning,
      ]
    );

    return result.rows[0];
  }

  /**
   * 使用AI生成预算建议理由
   */
  private async generateBudgetReasoning(
    category: string,
    sampleSize: number,
    optimalBudget: number,
    quality: string
  ): Promise<string> {
    const prompt = `作为平台的定价顾问，为企业解释预算建议。

任务类型：${category}
建议预算：¥${optimalBudget}
质量期望：${quality}
数据样本：${sampleSize}个同类任务

请用1-2句话解释为什么建议这个预算，包括：
1. 这个预算在市场上的位置（低/中/高）
2. 这个预算能匹配到什么水平的学生
3. 预期的任务完成质量

回复要简洁、专业，直接给建议，不要过多解释。`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
    } catch (error) {
      logger.error('AI生成预算理由失败:', error);
    }

    // 降级方案
    return `基于${sampleSize}个同类任务的成交数据，建议预算¥${optimalBudget}可以匹配到${
      quality === 'premium' ? '高级' : quality === 'basic' ? '入门' : '中级'
    }水平的学生，预期交付质量良好。`;
  }

  /**
   * 获取分类列表（用于模板筛选）
   */
  async getCategories(): Promise<any[]> {
    const result = await pool.query(
      `SELECT DISTINCT category, COUNT(*) as template_count
       FROM task_templates
       WHERE is_active = true
       GROUP BY category
       ORDER BY template_count DESC`
    );

    return result.rows;
  }

  /**
   * 搜索模板
   */
  async searchTemplates(keyword: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM task_templates
       WHERE is_active = true
         AND (
           template_name ILIKE $1
           OR template_description ILIKE $1
           OR $2 = ANY(tags)
         )
       ORDER BY usage_count DESC
       LIMIT 20`,
      [`%${keyword}%`, keyword]
    );

    return result.rows;
  }
}

export default new TaskExperienceService();
