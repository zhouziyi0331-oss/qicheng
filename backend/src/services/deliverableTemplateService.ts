/**
 * 交付标准模板服务 - E-02功能
 * 管理交付标准模板库，提供标准化的交付要求
 */

import { pool } from '../utils/db';
import logger from '../utils/logger';

interface DeliverableTemplate {
  id?: string;
  name: string;
  description: string;
  category: string;
  task_type: string;
  standards: {
    functional?: string[];
    quality?: string[];
    documentation?: string[];
    files?: string[];
  };
  checklist: Array<{
    item: string;
    required: boolean;
  }>;
  example_files?: any[];
  usage_count?: number;
  success_rate?: number;
  is_public?: boolean;
  is_official?: boolean;
  created_by?: string;
}

interface TemplateFilter {
  category?: string;
  task_type?: string;
  is_public?: boolean;
  is_official?: boolean;
}

class DeliverableTemplateService {
  /**
   * 创建交付标准模板
   */
  async createTemplate(template: DeliverableTemplate, userId: string): Promise<string> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO deliverable_templates (
          name, description, category, task_type,
          standards, checklist, example_files,
          is_public, is_official, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          template.name,
          template.description,
          template.category,
          template.task_type,
          JSON.stringify(template.standards),
          JSON.stringify(template.checklist),
          JSON.stringify(template.example_files || []),
          template.is_public !== false,
          template.is_official || false,
          userId,
        ]
      );

      logger.info('Created deliverable template', { id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取模板列表
   */
  async getTemplates(filter: TemplateFilter = {}, limit: number = 50): Promise<DeliverableTemplate[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM deliverable_templates WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filter.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filter.category);
        paramIndex++;
      }

      if (filter.task_type) {
        query += ` AND task_type = $${paramIndex}`;
        params.push(filter.task_type);
        paramIndex++;
      }

      if (filter.is_public !== undefined) {
        query += ` AND is_public = $${paramIndex}`;
        params.push(filter.is_public);
        paramIndex++;
      }

      if (filter.is_official !== undefined) {
        query += ` AND is_official = $${paramIndex}`;
        params.push(filter.is_official);
        paramIndex++;
      }

      query += ` ORDER BY is_official DESC, usage_count DESC, created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 获取单个模板
   */
  async getTemplate(templateId: string): Promise<DeliverableTemplate | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM deliverable_templates WHERE id = $1',
        [templateId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(templateId: string, updates: Partial<DeliverableTemplate>): Promise<void> {
    const client = await pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name) {
        fields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.description) {
        fields.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
      }

      if (updates.standards) {
        fields.push(`standards = $${paramIndex}`);
        values.push(JSON.stringify(updates.standards));
        paramIndex++;
      }

      if (updates.checklist) {
        fields.push(`checklist = $${paramIndex}`);
        values.push(JSON.stringify(updates.checklist));
        paramIndex++;
      }

      if (updates.example_files) {
        fields.push(`example_files = $${paramIndex}`);
        values.push(JSON.stringify(updates.example_files));
        paramIndex++;
      }

      if (updates.is_public !== undefined) {
        fields.push(`is_public = $${paramIndex}`);
        values.push(updates.is_public);
        paramIndex++;
      }

      if (fields.length === 0) {
        return;
      }

      fields.push('updated_at = NOW()');
      values.push(templateId);

      const query = `UPDATE deliverable_templates SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
      await client.query(query, values);

      logger.info('Updated template', { templateId });
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'DELETE FROM deliverable_templates WHERE id = $1',
        [templateId]
      );

      logger.info('Deleted template', { templateId });
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 为任务应用模板
   */
  async applyTemplateToTask(
    taskId: string,
    templateId: string,
    userId: string,
    customizations?: {
      customized_standards?: any;
      customized_checklist?: any;
    }
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 检查模板是否存在
      const templateResult = await client.query(
        'SELECT * FROM deliverable_templates WHERE id = $1',
        [templateId]
      );

      if (templateResult.rows.length === 0) {
        throw new Error('Template not found');
      }

      // 插入或更新关联
      await client.query(
        `INSERT INTO task_deliverable_templates (
          task_id, template_id, customized_standards, customized_checklist, applied_by
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (task_id, template_id) DO UPDATE SET
          customized_standards = EXCLUDED.customized_standards,
          customized_checklist = EXCLUDED.customized_checklist,
          applied_at = NOW()`,
        [
          taskId,
          templateId,
          JSON.stringify(customizations?.customized_standards || {}),
          JSON.stringify(customizations?.customized_checklist || []),
          userId,
        ]
      );

      // 增加模板使用次数
      await client.query(
        'UPDATE deliverable_templates SET usage_count = usage_count + 1 WHERE id = $1',
        [templateId]
      );

      await client.query('COMMIT');

      logger.info('Applied template to task', { taskId, templateId });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error applying template:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务的交付标准
   */
  async getTaskDeliverableStandards(taskId: string): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          tdt.customized_standards,
          tdt.customized_checklist,
          dt.name as template_name,
          dt.standards,
          dt.checklist
        FROM task_deliverable_templates tdt
        JOIN deliverable_templates dt ON tdt.template_id = dt.id
        WHERE tdt.task_id = $1`,
        [taskId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      // 合并模板标准和定制标准
      const standards = {
        ...row.standards,
        ...(row.customized_standards || {}),
      };

      const checklist = row.customized_checklist && row.customized_checklist.length > 0
        ? row.customized_checklist
        : row.checklist;

      return {
        template_name: row.template_name,
        standards,
        checklist,
      };
    } finally {
      client.release();
    }
  }

  /**
   * 获取模板分类列表
   */
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT category, COUNT(*) as count
         FROM deliverable_templates
         WHERE is_public = true
         GROUP BY category
         ORDER BY count DESC`
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 获取任务类型列表
   */
  async getTaskTypes(category?: string): Promise<Array<{ task_type: string; count: number }>> {
    const client = await pool.connect();
    try {
      let query = `SELECT task_type, COUNT(*) as count
                   FROM deliverable_templates
                   WHERE is_public = true`;
      const params: any[] = [];

      if (category) {
        query += ' AND category = $1';
        params.push(category);
      }

      query += ' GROUP BY task_type ORDER BY count DESC';

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 根据任务类型推荐模板
   */
  async recommendTemplates(taskDescription: string, limit: number = 5): Promise<DeliverableTemplate[]> {
    const client = await pool.connect();
    try {
      // 简单的关键词匹配推荐
      const keywords = {
        frontend: ['前端', '页面', 'react', 'vue', 'ui', '界面'],
        backend: ['后端', 'api', '接口', '数据库', 'node', 'java'],
        ui_design: ['设计', 'ui', 'ux', '原型', 'figma', 'sketch'],
        mobile: ['小程序', 'app', '移动', 'android', 'ios'],
      };

      const lowerDesc = taskDescription.toLowerCase();
      let taskType = 'frontend'; // 默认

      for (const [type, words] of Object.entries(keywords)) {
        if (words.some(word => lowerDesc.includes(word))) {
          taskType = type;
          break;
        }
      }

      const result = await client.query(
        `SELECT * FROM deliverable_templates
         WHERE task_type = $1 AND is_public = true
         ORDER BY is_official DESC, usage_count DESC, success_rate DESC NULLS LAST
         LIMIT $2`,
        [taskType, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 更新模板成功率
   */
  async updateTemplateSuccessRate(templateId: string, wasSuccessful: boolean): Promise<void> {
    const client = await pool.connect();
    try {
      // 获取当前成功率和使用次数
      const result = await client.query(
        'SELECT success_rate, usage_count FROM deliverable_templates WHERE id = $1',
        [templateId]
      );

      if (result.rows.length === 0) {
        return;
      }

      const { success_rate, usage_count } = result.rows[0];

      // 计算新的成功率（移动平均）
      const currentRate = success_rate || 0.5;
      const newRate = (currentRate * (usage_count - 1) + (wasSuccessful ? 1 : 0)) / usage_count;

      await client.query(
        'UPDATE deliverable_templates SET success_rate = $1 WHERE id = $2',
        [newRate, templateId]
      );

      logger.info('Updated template success rate', { templateId, newRate });
    } catch (error) {
      logger.error('Error updating template success rate:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new DeliverableTemplateService();
