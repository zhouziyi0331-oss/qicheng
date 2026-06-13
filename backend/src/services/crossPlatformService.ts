/**
 * 跨端打通服务
 * 实现企业端和学生端的双向联动功能
 */

import pool from '../config/database';
import logger from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RequirementChange {
  task_id: string;
  changed_by: string;
  old_requirements: any;
  new_requirements: any;
}

interface MatchingUpdateNotification {
  student_id: string;
  task_id: string;
  change_type: string;
  old_match_score: number;
  new_match_score: number;
  change_reason: string;
}

class CrossPlatformService {
  
  // ============================================================================
  // C-01: 需求变更的实时匹配更新
  // ============================================================================
  
  /**
   * 记录需求变更并触发重新匹配
   */
  async recordRequirementChange(data: RequirementChange) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. 生成需求变更摘要
      const changeSummary = await this.summarizeChange(data.old_requirements, data.new_requirements);

      // 2. 记录需求变更
      const changeResult = await client.query(`
        INSERT INTO task_requirement_changes (task_id, changed_by, old_requirements, new_requirements, change_summary)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        data.task_id,
        data.changed_by,
        data.old_requirements,
        data.new_requirements,
        changeSummary
      ]);
      
      // 2. 获取已匹配但未接单的学生
      const matchedStudents = await client.query(`
        SELECT tsm.student_id, tsm.match_score
        FROM task_student_matches tsm
        JOIN users u ON u.id = tsm.student_id
        WHERE tsm.task_id = $1
          AND tsm.status = 'pending'
      `, [data.task_id]);
      
      // 3. 重新计算匹配度
      const affectedStudents = [];
      for (const student of matchedStudents.rows) {
        const newScore = await this.recalculateMatchScore(
          student.student_id,
          data.task_id,
          data.new_requirements
        );
        
        affectedStudents.push({
          student_id: student.student_id,
          old_score: student.match_score,
          new_score: newScore
        });
        
        // 4. 创建通知
        const changeType = newScore > student.match_score ? 'score_improved' : 'score_decreased';
        const changeReason = await this.generateChangeReason(data.old_requirements, data.new_requirements);

        await this.createMatchingUpdateNotification({
          student_id: student.student_id,
          task_id: data.task_id,
          change_type: changeType,
          old_match_score: student.match_score,
          new_match_score: newScore,
          change_reason: changeReason
        });
      }
      
      // 5. 更新变更记录中的受影响学生
      await client.query(`
        UPDATE task_requirement_changes
        SET affected_students = $1
        WHERE id = $2
      `, [JSON.stringify(affectedStudents), changeResult.rows[0].id]);
      
      await client.query('COMMIT');
      
      return {
        change_id: changeResult.rows[0].id,
        affected_students_count: affectedStudents.length,
        improved_count: affectedStudents.filter(s => s.new_score > s.old_score).length,
        decreased_count: affectedStudents.filter(s => s.new_score < s.old_score).length
      };
      
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * 创建匹配更新通知
   */
  async createMatchingUpdateNotification(data: MatchingUpdateNotification) {
    await pool.query(`
      INSERT INTO matching_update_notifications 
        (student_id, task_id, change_type, old_match_score, new_match_score, change_reason)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      data.student_id,
      data.task_id,
      data.change_type,
      data.old_match_score,
      data.new_match_score,
      data.change_reason
    ]);
  }
  
  /**
   * 获取学生的匹配更新通知
   */
  async getMatchingUpdatesForStudent(studentId: string) {
    const result = await pool.query(`
      SELECT 
        mun.*,
        t.title AS task_title,
        t.category AS task_category,
        u.username AS company_name
      FROM matching_update_notifications mun
      JOIN tasks t ON t.id = mun.task_id
      JOIN users u ON u.id = t.company_id
      WHERE mun.student_id = $1
        AND mun.notification_sent = FALSE
      ORDER BY mun.created_at DESC
      LIMIT 10
    `, [studentId]);
    
    // 标记为已发送
    if (result.rows.length > 0) {
      const ids = result.rows.map(r => r.id);
      await pool.query(`
        UPDATE matching_update_notifications
        SET notification_sent = TRUE
        WHERE id = ANY($1)
      `, [ids]);
    }
    
    return result.rows;
  }
  
  // ============================================================================
  // C-02: 学生等级变化的主动推荐
  // ============================================================================
  
  /**
   * 处理学生等级变化（由触发器调用）
   */
  async handleLevelChange(studentId: string, oldLevel: number, newLevel: number) {
    const client = await pool.connect();
    
    try {
      // 1. 查找现在可以匹配的新任务
      const newTasks = await client.query(`
        SELECT t.id, t.title, t.category
        FROM tasks t
        WHERE t.status = 'published'
          AND t.required_level <= $1
          AND t.required_level > $2
          AND NOT EXISTS (
            SELECT 1 FROM task_student_matches tsm
            WHERE tsm.student_id = $3 AND tsm.task_id = t.id
          )
        LIMIT 10
      `, [newLevel, oldLevel, studentId]);
      
      // 2. 查找关注该学生的企业
      const watchingCompanies = await client.query(`
        SELECT company_id, watch_note
        FROM company_student_watching
        WHERE student_id = $1
          AND condition_met = TRUE
          AND notified = FALSE
      `, [studentId]);
      
      // 3. 更新等级变化记录
      await client.query(`
        UPDATE student_level_changes
        SET 
          new_matched_tasks = $1,
          notified_companies = $2,
          triggered_rematch = TRUE
        WHERE student_id = $3
          AND old_level = $4
          AND new_level = $5
      `, [
        JSON.stringify(newTasks.rows.map(t => t.id)),
        JSON.stringify(watchingCompanies.rows.map(c => c.company_id)),
        studentId,
        oldLevel,
        newLevel
      ]);
      
      // 4. 标记企业已通知
      if (watchingCompanies.rows.length > 0) {
        await client.query(`
          UPDATE company_student_watching
          SET notified = TRUE, notified_at = NOW()
          WHERE student_id = $1 AND condition_met = TRUE AND notified = FALSE
        `, [studentId]);
      }
      
      return {
        new_tasks_count: newTasks.rows.length,
        new_tasks: newTasks.rows,
        notified_companies_count: watchingCompanies.rows.length
      };
      
    } finally {
      client.release();
    }
  }
  
  // ============================================================================
  // C-03: 企业端"等一个人"功能
  // ============================================================================
  
  /**
   * 企业设置等待学生成长的条件
   */
  async setWatchStudent(companyId: string, studentId: string, condition: any, note?: string) {
    const result = await pool.query(`
      INSERT INTO company_student_watching 
        (company_id, student_id, watch_condition, watch_note)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (company_id, student_id, watch_condition)
      DO UPDATE SET watch_note = EXCLUDED.watch_note
      RETURNING id
    `, [companyId, studentId, condition, note]);
    
    return result.rows[0];
  }
  
  /**
   * 获取企业等待的学生列表
   */
  async getWatchingStudents(companyId: string) {
    const result = await pool.query(`
      SELECT 
        csw.*,
        u.username AS student_name,
        u.student_level AS current_level,
        u.avatar,
        (
          SELECT COUNT(*)
          FROM tasks
          WHERE student_id = csw.student_id 
            AND status = 'completed'
        ) AS completed_tasks
      FROM company_student_watching csw
      JOIN users u ON u.id = csw.student_id
      WHERE csw.company_id = $1
      ORDER BY csw.created_at DESC
    `, [companyId]);
    
    return result.rows;
  }
  
  // ============================================================================
  // C-05: 任务进行中的透明度
  // ============================================================================
  
  /**
   * 学生更新任务进度
   */
  async updateTaskProgress(
    taskId: string,
    studentId: string,
    stage: string,
    progressPercentage: number,
    estimatedCompletion?: Date
  ) {
    const stageNames: Record<string, string> = {
      ideation: '创意构思中',
      drafting: '初稿制作中',
      revising: '修改打磨中',
      finalizing: '最后润色中'
    };
    
    const result = await pool.query(`
      INSERT INTO task_realtime_progress 
        (task_id, student_id, current_stage, stage_display_name, stage_started_at, 
         estimated_completion, progress_percentage)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6)
      ON CONFLICT (task_id)
      DO UPDATE SET
        current_stage = EXCLUDED.current_stage,
        stage_display_name = EXCLUDED.stage_display_name,
        stage_started_at = NOW(),
        estimated_completion = EXCLUDED.estimated_completion,
        progress_percentage = EXCLUDED.progress_percentage,
        updated_at = NOW()
      RETURNING *
    `, [taskId, studentId, stage, stageNames[stage], estimatedCompletion, progressPercentage]);
    
    // 通知企业
    await pool.query(`SELECT pg_notify('task_progress_updated', $1)`, [
      JSON.stringify({ task_id: taskId, stage: stage, progress: progressPercentage })
    ]);
    
    return result.rows[0];
  }
  
  /**
   * 企业查看任务进度
   */
  async getTaskProgress(taskId: string, companyId: string) {
    const client = await pool.connect();
    
    try {
      // 1. 获取进度
      const progress = await client.query(`
        SELECT * FROM task_realtime_progress
        WHERE task_id = $1 AND progress_visibility = TRUE
      `, [taskId]);
      
      if (progress.rows.length === 0) {
        return null;
      }
      
      // 2. 记录企业查看
      await client.query(`
        INSERT INTO company_progress_views (company_id, task_id, progress_snapshot)
        VALUES ($1, $2, $3)
      `, [companyId, taskId, progress.rows[0]]);
      
      return progress.rows[0];
      
    } finally {
      client.release();
    }
  }
  
  // ============================================================================
  // C-06: 卡点时刻的信任加固
  // ============================================================================
  
  /**
   * 记录卡点并生成脱敏摘要
   */
  async recordBlockage(
    taskId: string,
    studentId: string,
    blockageType: string,
    description: string
  ) {
    // 使用AI生成脱敏摘要
    const desensitizedSummary = await this.generateDesensitizedSummary(description, blockageType);
    
    const result = await pool.query(`
      INSERT INTO task_blockage_summaries 
        (task_id, student_id, blockage_type, blockage_description, 
         desensitized_summary, resolution_status)
      VALUES ($1, $2, $3, $4, $5, 'in_progress')
      RETURNING *
    `, [taskId, studentId, blockageType, description, desensitizedSummary]);
    
    // 通知企业
    await pool.query(`SELECT pg_notify('task_blockage_detected', $1)`, [
      JSON.stringify({ task_id: taskId, summary: desensitizedSummary })
    ]);
    
    return result.rows[0];
  }
  
  /**
   * 使用AI生成脱敏摘要
   */
  private async generateDesensitizedSummary(description: string, blockageType: string): Promise<string> {
    const typeNames: Record<string, string> = {
      creative_direction: '创意方向',
      technical_issue: '技术问题',
      unclear_requirement: '需求理解'
    };
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `学生在任务执行中遇到了${typeNames[blockageType] || '问题'}，详细描述如下：

"${description}"

请生成一段脱敏的、对企业友好的摘要（50字以内），告诉企业：
1. 学生遇到了什么类型的问题
2. 问题正在被解决
3. 预计不会影响交付时间（如果描述中提到）

注意：不要透露学生的具体困惑细节，只说明问题类型和处理状态。`
      }]
    });
    
    const summary = message.content[0].type === 'text' ? message.content[0].text : '';
    return summary;
  }
  
  // ============================================================================
  // C-09 & C-10: 关注关系的双向触达
  // ============================================================================
  
  /**
   * 企业关注学生
   */
  async followStudent(companyId: string, studentId: string, reason?: string, source?: string) {
    const result = await pool.query(`
      INSERT INTO company_student_follows 
        (company_id, student_id, follow_reason, follow_source)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (company_id, student_id)
      DO UPDATE SET
        follow_reason = EXCLUDED.follow_reason,
        last_interaction_at = NOW(),
        interaction_count = company_student_follows.interaction_count + 1
      RETURNING *
    `, [companyId, studentId, reason, source || 'manual']);
    
    // 触发器会自动通知学生
    
    return result.rows[0];
  }
  
  /**
   * 获取企业关注的学生动态
   */
  async getFollowedStudentsUpdates(companyId: string) {
    const result = await pool.query(`
      SELECT * FROM company_followed_students_updates
      WHERE company_id = $1
      ORDER BY 
        CASE WHEN new_tasks_completed > 0 THEN 0 ELSE 1 END,
        last_interaction_at DESC NULLS LAST
      LIMIT 20
    `, [companyId]);
    
    return result.rows;
  }
  
  /**
   * 获取学生的关注者（企业）
   */
  async getStudentFollowers(studentId: string) {
    const result = await pool.query(`
      SELECT * FROM student_company_followers
      WHERE student_id = $1
      ORDER BY followed_at DESC
    `, [studentId]);
    
    return result.rows;
  }
  
  // ============================================================================
  // C-07 & C-08: 共享声誉系统
  // ============================================================================
  
  /**
   * 创建双向评价
   */
  async createMutualRating(data: {
    task_id: string;
    company_id: string;
    student_id: string;
    company_to_student_rating: number;
    company_to_student_comment: string;
    student_to_company_rating: number;
    student_to_company_comment: string;
    student_to_company_dimensions?: any;
  }) {
    const mutualSatisfaction = 
      data.company_to_student_rating >= 4.0 && 
      data.student_to_company_rating >= 4.0;
    
    const result = await pool.query(`
      INSERT INTO mutual_ratings 
        (task_id, company_id, student_id, 
         company_to_student_rating, company_to_student_comment,
         student_to_company_rating, student_to_company_comment,
         student_to_company_dimensions, mutual_satisfaction)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      data.task_id,
      data.company_id,
      data.student_id,
      data.company_to_student_rating,
      data.company_to_student_comment,
      data.student_to_company_rating,
      data.student_to_company_comment,
      data.student_to_company_dimensions,
      mutualSatisfaction
    ]);
    
    // 触发器会自动生成关系标签
    
    return result.rows[0];
  }
  
  /**
   * 获取企业-学生的关系标签
   */
  async getRelationshipBadges(companyId: string, studentId: string) {
    const result = await pool.query(`
      SELECT * FROM relationship_badges
      WHERE company_id = $1 AND student_id = $2
      ORDER BY earned_at DESC
    `, [companyId, studentId]);
    
    return result.rows;
  }
  
  /**
   * 学生添加创作说明
   */
  async addCreationNotes(data: {
    task_id: string;
    student_id: string;
    style_explanation?: string;
    creative_challenge?: string;
    satisfaction_highlight?: string;
    time_spent_hours?: number;
    tools_used?: string[];
  }) {
    const result = await pool.query(`
      INSERT INTO deliverable_creation_notes 
        (task_id, student_id, style_explanation, creative_challenge, 
         satisfaction_highlight, time_spent_hours, tools_used)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (task_id)
      DO UPDATE SET
        style_explanation = EXCLUDED.style_explanation,
        creative_challenge = EXCLUDED.creative_challenge,
        satisfaction_highlight = EXCLUDED.satisfaction_highlight,
        time_spent_hours = EXCLUDED.time_spent_hours,
        tools_used = EXCLUDED.tools_used
      RETURNING *
    `, [
      data.task_id,
      data.student_id,
      data.style_explanation,
      data.creative_challenge,
      data.satisfaction_highlight,
      data.time_spent_hours,
      data.tools_used
    ]);
    
    return result.rows[0];
  }
  
  // ============================================================================
  // 辅助方法 - 真实实现
  // ============================================================================

  /**
   * 使用AI生成需求变更摘要
   */
  private async summarizeChange(oldReq: any, newReq: any): Promise<string> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `对比以下两个任务需求，用一句话概括主要变化：

旧需求：${JSON.stringify(oldReq, null, 2)}
新需求：${JSON.stringify(newReq, null, 2)}

只返回变化摘要，不超过30字。`
        }]
      });

      return message.content[0].type === 'text' ? message.content[0].text : '需求已更新';
    } catch (error: unknown) {
      logger.error('AI摘要生成失败:', error);
      return '需求已更新';
    }
  }

  /**
   * 重新计算匹配分数 - 真实算法
   */
  private async recalculateMatchScore(
    studentId: string,
    taskId: string,
    requirements: any
  ): Promise<number> {
    const client = await pool.connect();

    try {
      // 1. 获取学生能力数据
      const studentResult = await client.query(`
        SELECT
          student_level,
          capability_skills,
          total_tasks_completed,
          avg_task_rating,
          on_time_delivery_rate
        FROM users
        WHERE id = $1 AND user_type = 'student'
      `, [studentId]);

      if (studentResult.rows.length === 0) return 0;
      const student = studentResult.rows[0];

      // 2. 获取任务要求
      const taskResult = await client.query(`
        SELECT category, required_level, required_skills, budget
        FROM tasks
        WHERE id = $1
      `, [taskId]);

      if (taskResult.rows.length === 0) return 0;
      const task = taskResult.rows[0];

      // 3. 计算匹配分数
      let score = 0;

      // 等级匹配 (30分)
      if (student.student_level >= task.required_level) {
        score += 30;
      } else {
        score += (student.student_level / task.required_level) * 20;
      }

      // 技能匹配 (40分)
      const requiredSkills = task.required_skills || [];
      const studentSkills = student.capability_skills || {};
      let skillMatchCount = 0;

      for (const skill of requiredSkills) {
        if (studentSkills[skill] && studentSkills[skill] >= 0.6) {
          skillMatchCount++;
        }
      }

      if (requiredSkills.length > 0) {
        score += (skillMatchCount / requiredSkills.length) * 40;
      } else {
        score += 30; // 无明确技能要求，给予基础分
      }

      // 经验匹配 (15分)
      if (student.total_tasks_completed >= 10) {
        score += 15;
      } else {
        score += (student.total_tasks_completed / 10) * 15;
      }

      // 信誉匹配 (15分)
      if (student.avg_task_rating >= 4.5) {
        score += 15;
      } else if (student.avg_task_rating >= 4.0) {
        score += 12;
      } else if (student.avg_task_rating >= 3.5) {
        score += 8;
      } else {
        score += 5;
      }

      // 按时交付率加成
      if (student.on_time_delivery_rate >= 0.9) {
        score += 5;
      }

      return Math.min(Math.round(score), 100);

    } finally {
      client.release();
    }
  }

  /**
   * 生成需求变更原因 - 真实分析
   */
  private async generateChangeReason(oldReq: any, newReq: any): Promise<string> {
    try {
      // 分析具体变化
      const changes: string[] = [];

      // 检查技能要求变化
      if (JSON.stringify(oldReq.skills) !== JSON.stringify(newReq.skills)) {
        const oldSkills = oldReq.skills || [];
        const newSkills = newReq.skills || [];
        const added = newSkills.filter((s: string) => !oldSkills.includes(s));
        const removed = oldSkills.filter((s: string) => !newSkills.includes(s));

        if (added.length > 0) {
          changes.push(`新增了对「${added.join('、')}」的要求`);
        }
        if (removed.length > 0) {
          changes.push(`移除了「${removed.join('、')}」要求`);
        }
      }

      // 检查预算变化
      if (oldReq.budget !== newReq.budget) {
        if (newReq.budget > oldReq.budget) {
          changes.push('预算提高了');
        } else {
          changes.push('预算降低了');
        }
      }

      // 检查交付时间变化
      if (oldReq.deadline !== newReq.deadline) {
        changes.push('截止时间调整了');
      }

      if (changes.length > 0) {
        return changes.join('，');
      }

      return '任务需求有更新';

    } catch (error: unknown) {
      logger.error('变更原因生成失败:', error);
      return '任务需求已更新';
    }
  }
}

export default new CrossPlatformService();
