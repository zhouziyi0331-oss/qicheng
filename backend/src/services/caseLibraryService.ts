/**
 * Phase 2.4: 案例库管理服务
 * 管理真实学生案例，供AI导师引用和学生浏览
 */

import { pool } from '../config/database';
import logger from '../utils/logger';

export interface StudentCase {
  id: string;
  caseType: 'stuck' | 'breakthrough' | 'success';
  category: string; // 任务类型或能力类型
  title: string;
  situation: string; // 遇到的情况
  solution?: string; // 解决方案
  outcome?: string; // 结果
  emotion?: string; // 情绪描述
  timeToResolve?: number; // 花费时间（分钟）
  difficulty: number; // 1-5
  helpfulness: number; // 有多少人觉得有帮助
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseFilter {
  caseType?: 'stuck' | 'breakthrough' | 'success';
  category?: string;
  difficulty?: number;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CaseStats {
  totalCases: number;
  byType: {
    stuck: number;
    breakthrough: number;
    success: number;
  };
  popularCategories: Array<{ category: string; count: number }>;
  popularTags: Array<{ tag: string; count: number }>;
}

class CaseLibraryService {
  /**
   * 从mentor_growth_observations自动提取案例
   * 这个方法扫描observation表，将有价值的记录转换为案例
   */
  async extractCasesFromObservations(): Promise<number> {
    const client = await pool.connect();
    try {
      // 查找卡点案例（stuck > 30分钟后突破）
      const stuckCases = await client.query(`
        SELECT
          o.id,
          o.student_id,
          o.observation_type,
          o.context,
          o.stuck_duration,
          o.breakthrough_method,
          o.created_at
        FROM mentor_growth_observations o
        WHERE o.observation_type = 'stuck'
          AND o.stuck_duration > 30
          AND o.breakthrough_method IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM case_library c
            WHERE c.source_observation_id = o.id
          )
        ORDER BY o.created_at DESC
        LIMIT 50
      `);

      let extractedCount = 0;

      for (const row of stuckCases.rows) {
        const context = row.context || {};
        const breakthroughMethod = row.breakthrough_method || {};

        await client.query(`
          INSERT INTO case_library (
            id, case_type, category, title, situation, solution,
            time_to_resolve, difficulty, tags, source_observation_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          'stuck',
          context.task_type || context.ability_type || 'general',
          this.generateTitle(context, 'stuck'),
          this.extractSituation(context, row.stuck_duration),
          breakthroughMethod.description || breakthroughMethod.hint_given,
          row.stuck_duration,
          this.calculateDifficulty(row.stuck_duration, context),
          this.extractTags(context),
          row.id
        ]);

        extractedCount++;
      }

      // 查找突破案例（skill_mastery事件）
      const breakthroughCases = await client.query(`
        SELECT
          o.id,
          o.student_id,
          o.observation_type,
          o.context,
          o.created_at
        FROM mentor_growth_observations o
        WHERE o.observation_type = 'skill_mastery'
          AND NOT EXISTS (
            SELECT 1 FROM case_library c
            WHERE c.source_observation_id = o.id
          )
        ORDER BY o.created_at DESC
        LIMIT 30
      `);

      for (const row of breakthroughCases.rows) {
        const context = row.context || {};

        await client.query(`
          INSERT INTO case_library (
            id, case_type, category, title, situation, outcome,
            difficulty, tags, source_observation_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          'breakthrough',
          context.skill_name || context.ability_type || 'general',
          this.generateTitle(context, 'breakthrough'),
          this.extractSituation(context, null),
          context.achievement_description || '成功掌握新技能',
          context.difficulty_level || 3,
          this.extractTags(context),
          row.id
        ]);

        extractedCount++;
      }

      logger.info('[CaseLibrary] 提取案例完成', { extractedCount });
      return extractedCount;
    } finally {
      client.release();
    }
  }

  /**
   * 搜索案例
   */
  async searchCases(filter: CaseFilter): Promise<{ cases: StudentCase[]; total: number }> {
    const client = await pool.connect();
    try {
      let whereConditions: string[] = ['1=1'];
      let params: any[] = [];
      let paramIndex = 1;

      if (filter.caseType) {
        whereConditions.push(`case_type = $${paramIndex}`);
        params.push(filter.caseType);
        paramIndex++;
      }

      if (filter.category) {
        whereConditions.push(`category = $${paramIndex}`);
        params.push(filter.category);
        paramIndex++;
      }

      if (filter.difficulty) {
        whereConditions.push(`difficulty = $${paramIndex}`);
        params.push(filter.difficulty);
        paramIndex++;
      }

      if (filter.tags && filter.tags.length > 0) {
        whereConditions.push(`tags && $${paramIndex}`);
        params.push(filter.tags);
        paramIndex++;
      }

      if (filter.search) {
        whereConditions.push(`(
          title ILIKE $${paramIndex} OR
          situation ILIKE $${paramIndex} OR
          solution ILIKE $${paramIndex}
        )`);
        params.push(`%${filter.search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // 获取总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM case_library WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // 获取案例列表
      const limit = filter.limit || 20;
      const offset = filter.offset || 0;

      const result = await client.query(`
        SELECT
          id, case_type, category, title, situation, solution, outcome,
          emotion, time_to_resolve, difficulty, helpfulness, tags,
          created_at, updated_at
        FROM case_library
        WHERE ${whereClause}
        ORDER BY helpfulness DESC, created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      const cases = result.rows.map(row => ({
        id: row.id,
        caseType: row.case_type,
        category: row.category,
        title: row.title,
        situation: row.situation,
        solution: row.solution,
        outcome: row.outcome,
        emotion: row.emotion,
        timeToResolve: row.time_to_resolve,
        difficulty: row.difficulty,
        helpfulness: row.helpfulness || 0,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return { cases, total };
    } finally {
      client.release();
    }
  }

  /**
   * 获取单个案例详情
   */
  async getCaseById(caseId: string): Promise<StudentCase | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          id, case_type, category, title, situation, solution, outcome,
          emotion, time_to_resolve, difficulty, helpfulness, tags,
          created_at, updated_at
        FROM case_library
        WHERE id = $1
      `, [caseId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        caseType: row.case_type,
        category: row.category,
        title: row.title,
        situation: row.situation,
        solution: row.solution,
        outcome: row.outcome,
        emotion: row.emotion,
        timeToResolve: row.time_to_resolve,
        difficulty: row.difficulty,
        helpfulness: row.helpfulness || 0,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * 标记案例为有帮助
   */
  async markCaseHelpful(caseId: string, studentId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      // 检查是否已经标记过
      const checkResult = await client.query(`
        SELECT 1 FROM case_helpfulness_votes
        WHERE case_id = $1 AND student_id = $2
      `, [caseId, studentId]);

      if (checkResult.rows.length > 0) {
        return false; // 已经标记过
      }

      // 记录投票
      await client.query(`
        INSERT INTO case_helpfulness_votes (case_id, student_id, created_at)
        VALUES ($1, $2, NOW())
      `, [caseId, studentId]);

      // 更新案例的helpfulness计数
      await client.query(`
        UPDATE case_library
        SET helpfulness = helpfulness + 1
        WHERE id = $1
      `, [caseId]);

      return true;
    } finally {
      client.release();
    }
  }

  /**
   * 获取案例统计
   */
  async getCaseStats(): Promise<CaseStats> {
    const client = await pool.connect();
    try {
      // 总数和类型分布
      const typeStats = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE case_type = 'stuck') as stuck_count,
          COUNT(*) FILTER (WHERE case_type = 'breakthrough') as breakthrough_count,
          COUNT(*) FILTER (WHERE case_type = 'success') as success_count
        FROM case_library
      `);

      const typeRow = typeStats.rows[0];

      // 热门类别
      const categoryStats = await client.query(`
        SELECT category, COUNT(*) as count
        FROM case_library
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `);

      // 热门标签
      const tagStats = await client.query(`
        SELECT unnest(tags) as tag, COUNT(*) as count
        FROM case_library
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
      `);

      return {
        totalCases: parseInt(typeRow.total),
        byType: {
          stuck: parseInt(typeRow.stuck_count),
          breakthrough: parseInt(typeRow.breakthrough_count),
          success: parseInt(typeRow.success_count)
        },
        popularCategories: categoryStats.rows.map(r => ({
          category: r.category,
          count: parseInt(r.count)
        })),
        popularTags: tagStats.rows.map(r => ({
          tag: r.tag,
          count: parseInt(r.count)
        }))
      };
    } finally {
      client.release();
    }
  }

  /**
   * 为AI导师查找相关案例
   */
  async findRelevantCases(params: {
    category?: string;
    tags?: string[];
    caseType?: 'stuck' | 'breakthrough' | 'success';
    limit?: number;
  }): Promise<StudentCase[]> {
    const filter: CaseFilter = {
      category: params.category,
      tags: params.tags,
      caseType: params.caseType,
      limit: params.limit || 5
    };

    const { cases } = await this.searchCases(filter);
    return cases;
  }

  // ============ 辅助方法 ============

  private generateTitle(context: any, type: 'stuck' | 'breakthrough'): string {
    if (type === 'stuck') {
      const taskType = context.task_type || '任务';
      return `${taskType}遇到困难`;
    } else {
      const skillName = context.skill_name || '新技能';
      return `掌握了${skillName}`;
    }
  }

  private extractSituation(context: any, stuckDuration: number | null): string {
    const parts: string[] = [];

    if (context.task_type) {
      parts.push(`在进行${context.task_type}时`);
    }

    if (context.error_message) {
      parts.push(`遇到了"${context.error_message}"`);
    } else if (context.confusion_point) {
      parts.push(`对${context.confusion_point}感到困惑`);
    }

    if (stuckDuration && stuckDuration > 60) {
      parts.push(`尝试了${Math.floor(stuckDuration / 60)}小时`);
    }

    return parts.join('，') || '遇到了挑战';
  }

  private calculateDifficulty(stuckDuration: number, context: any): number {
    let difficulty = 3; // 默认中等

    if (stuckDuration > 180) difficulty = 5;
    else if (stuckDuration > 120) difficulty = 4;
    else if (stuckDuration > 60) difficulty = 3;
    else if (stuckDuration > 30) difficulty = 2;
    else difficulty = 1;

    // 根据上下文调整
    if (context.required_advanced_knowledge) {
      difficulty = Math.min(5, difficulty + 1);
    }

    return difficulty;
  }

  private extractTags(context: any): string[] {
    const tags: string[] = [];

    if (context.task_type) tags.push(context.task_type);
    if (context.ability_type) tags.push(context.ability_type);
    if (context.skill_name) tags.push(context.skill_name);
    if (context.technology) tags.push(context.technology);
    if (context.error_type) tags.push(context.error_type);

    // 添加通用标签
    if (context.required_debugging) tags.push('调试');
    if (context.required_research) tags.push('研究');
    if (context.required_collaboration) tags.push('协作');

    return [...new Set(tags)]; // 去重
  }
}

export default new CaseLibraryService();
