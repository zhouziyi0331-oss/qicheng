/**
 * 学生能力更新服务
 * 动态更新学生能力画 像
 * 基于任务完成情况更新技能、质量、成长趋势
 */

import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';
import vectorGenerationService from './vectorGenerationService';

interface OPCResults {
  openness: number;
  persistence: number;
  creativity: number;
  personality_style: string;
}

interface TaskPerformance {
  task_id: string;
  quality_score: number;
  client_satisfaction: number;
  delivered_on_time: boolean;
  response_time_hours: number;
  skills_used: string[];
}

interface GrowthTrend {
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  growth_rate: number;
  skill_acquisition_rate: number;
  recent_quality_avg: number;
  quality_change: number;
}

class StudentCapabilityService {
  /**
   * 初始化学生能力画像
   */
  async initializeCapability(studentId: string, opcResults: OPCResults): Promise<void> {
    const client = await pool.connect();
    try {
      logger.info(`Initializing capability for student: ${studentId}`);

      // 检查是否已存在
      const existingResult = await client.query(
        'SELECT id FROM student_capabilities WHERE student_id = $1',
        [studentId]
      );

      if (existingResult.rows.length > 0) {
        logger.info(`Capability already exists for student: ${studentId}`);
        return;
      }

      // 创建初始能力画像
      await client.query(
        `INSERT INTO student_capabilities (
          student_id, skills, tasks_completed, avg_task_quality,
          avg_client_satisfaction, on_time_delivery_rate,
          opc_openness, opc_persistence, opc_creativity, personality_style,
          quality_trend, growth_rate, skill_acquisition_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          studentId,
          JSON.stringify({}),
          0,
          0.5,
          0.5,
          1.0,
          opcResults.openness,
          opcResults.persistence,
          opcResults.creativity,
          opcResults.personality_style,
          'unknown',
          0.5,
          0.5,
        ]
      );

      // 生成初始向量
      await vectorGenerationService.updateStudentEmbedding(studentId);

      logger.info(`Initialized capability for student: ${studentId}`);
    } catch (error: unknown) {
      logger.error('Error initializing capability:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 任务完成后更新能力
   */
  async updateAfterTaskCompletion(
    studentId: string,
    taskId: string,
    performance: TaskPerformance
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      logger.info(`Updating capability for student ${studentId} after task ${taskId}`);

      // 获取当前能力画像
      const capabilityResult = await client.query(
        'SELECT * FROM student_capabilities WHERE student_id = $1',
        [studentId]
      );

      if (capabilityResult.rows.length === 0) {
        logger.warn(`No capability found for student ${studentId}, initializing...`);
        await this.initializeCapability(studentId, {
          openness: 50,
          persistence: 50,
          creativity: 50,
          personality_style: 'unknown',
        });
        // 重新获取
        const newResult = await client.query(
          'SELECT * FROM student_capabilities WHERE student_id = $1',
          [studentId]
        );
        if (newResult.rows.length === 0) {
          throw new Error('Failed to initialize capability');
        }
      }

      const capability = capabilityResult.rows[0] || (await client.query(
        'SELECT * FROM student_capabilities WHERE student_id = $1',
        [studentId]
      )).rows[0];

      // 更新技能
      const updatedSkills = this.updateSkills(
        capability.skills || {},
        performance.skills_used
      );

      // 更新任务数
      const newTasksCompleted = (capability.tasks_completed || 0) + 1;

      // 更新平均质量（移动平均）
      const oldAvgQuality = capability.avg_task_quality || 0.5;
      const newAvgQuality = (oldAvgQuality * capability.tasks_completed + performance.quality_score) /
        newTasksCompleted;

      // 更新平均满意度
      const oldAvgSatisfaction = capability.avg_client_satisfaction || 0.5;
      const newAvgSatisfaction = (oldAvgSatisfaction * capability.tasks_completed + performance.client_satisfaction) /
        newTasksCompleted;

      // 更新按时交付率
      const oldOnTimeCount = Math.round((capability.on_time_delivery_rate || 1.0) * capability.tasks_completed);
      const newOnTimeCount = oldOnTimeCount + (performance.delivered_on_time ? 1 : 0);
      const newOnTimeRate = newOnTimeCount / newTasksCompleted;

      // 更新平均响应时间
      const oldAvgResponseTime = capability.avg_response_time_hours || 24;
      const newAvgResponseTime = (oldAvgResponseTime * capability.tasks_completed + performance.response_time_hours) /
        newTasksCompleted;

      // 计算成长趋势
      const growthTrend = await this.calculateGrowthTrend(studentId);

      // 更新数据库
      await client.query(
        `UPDATE student_capabilities SET
          skills = $1,
          tasks_completed = $2,
          avg_task_quality = $3,
          avg_client_satisfaction = $4,
          on_time_delivery_rate = $5,
          avg_response_time_hours = $6,
          quality_trend = $7,
          growth_rate = $8,
          skill_acquisition_rate = $9,
          updated_at = NOW()
        WHERE student_id = $10`,
        [
          JSON.stringify(updatedSkills),
          newTasksCompleted,
          newAvgQuality,
          newAvgSatisfaction,
          newOnTimeRate,
          newAvgResponseTime,
          growthTrend.trend,
          growthTrend.growth_rate,
          growthTrend.skill_acquisition_rate,
          studentId,
        ]
      );

      // 更新向量
      await vectorGenerationService.updateStudentEmbedding(studentId);

      await client.query('COMMIT');

      logger.info(`Updated capability for student: ${studentId}`);
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      logger.error('Error updating capability:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新技能熟练度
   */
  private updateSkills(currentSkills: any, usedSkills: string[]): any {
    const skills = { ...currentSkills };

    for (const skill of usedSkills) {
      if (!skills[skill]) {
        skills[skill] = {
          proficiency: 0.5,
          confidence: 0.5,
          lastPracticed: new Date().toISOString(),
          practiceCount: 1,
        };
      } else {
        // 增加熟练度（每次练习+0.05，最大1.0）
        skills[skill].proficiency = Math.min(skills[skill].proficiency + 0.05, 1.0);
        skills[skill].confidence = Math.min(skills[skill].confidence + 0.03, 1.0);
        skills[skill].lastPracticed = new Date().toISOString();
        skills[skill].practiceCount = (skills[skill].practiceCount || 0) + 1;
      }
    }

    return skills;
  }

  /**
   * 计算学生成长趋势
   */
  async calculateGrowthTrend(studentId: string): Promise<GrowthTrend> {
    const client = await pool.connect();
    try {
      // 获取最近10个任务的质量评分
      const recentTasksResult = await client.query(
        `SELECT quality_score, created_at
         FROM task_submissions
         WHERE student_id = $1 AND quality_score IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 10`,
        [studentId]
      );

      const recentTasks = recentTasksResult.rows;

      if (recentTasks.length < 3) {
        return {
          trend: 'unknown',
          growth_rate: 0.5,
          skill_acquisition_rate: 0.5,
          recent_quality_avg: 0.5,
          quality_change: 0,
        };
      }

      // 计算最近5个任务的平均质量
      const recent5 = recentTasks.slice(0, 5);
      const recent5Avg = recent5.reduce((sum, t) => sum + t.quality_score, 0) / recent5.length;

      // 计算之前5个任务的平均质量
      const previous5 = recentTasks.slice(5, 10);
      const previous5Avg = previous5.length > 0
        ? previous5.reduce((sum, t) => sum + t.quality_score, 0) / previous5.length
        : recent5Avg;

      // 计算质量变化
      const qualityChange = recent5Avg - previous5Avg;

      // 确定趋势
      let trend: 'improving' | 'stable' | 'declining' | 'unknown' = 'stable';
      if (qualityChange > 0.1) {
        trend = 'improving';
      } else if (qualityChange < -0.1) {
        trend = 'declining';
      }

      // 计算成长率（基于质量变化和任务完成速度）
      const growthRate = Math.min(Math.max(0.5 + qualityChange, 0), 1);

      // 计算技能获取速度（基于最近获得的新技能数量）
      const capabilityResult = await client.query(
        'SELECT skills FROM student_capabilities WHERE student_id = $1',
        [studentId]
      );

      let skillAcquisitionRate = 0.5;
      if (capabilityResult.rows.length > 0) {
        const skills = capabilityResult.rows[0].skills || {};
        const recentSkills = Object.values(skills).filter((skill: any) => {
          const lastPracticed = new Date(skill.lastPracticed);
          const daysSince = (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince < 30;
        });
        skillAcquisitionRate = Math.min(recentSkills.length / 10, 1);
      }

      return {
        trend,
        growth_rate: growthRate,
        skill_acquisition_rate: skillAcquisitionRate,
        recent_quality_avg: recent5Avg,
        quality_change: qualityChange,
      };
    } catch (error: unknown) {
      logger.error('Error calculating growth trend:', error);
      return {
        trend: 'unknown',
        growth_rate: 0.5,
        skill_acquisition_rate: 0.5,
        recent_quality_avg: 0.5,
        quality_change: 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * 更新学生向量
   */
  async updateStudentVectors(studentId: string): Promise<void> {
    try {
      await vectorGenerationService.updateStudentEmbedding(studentId);
      logger.info(`Updated vectors for student: ${studentId}`);
    } catch (error: unknown) {
      logger.error('Error updating student vectors:', error);
      throw error;
    }
  }

  /**
   * 获取学生能力画像
   */
  async getCapability(studentId: string): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM student_capabilities WHERE student_id = $1',
        [studentId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * 批量初始化学生能力（用于迁移）
   */
  async batchInitializeCapabilities(limit: number = 100): Promise<number> {
    const client = await pool.connect();
    try {
      // 获取没有能力画像的学生
      const studentsResult = await client.query(
        `SELECT u.id, o.openness, o.persistence, o.creativity, o.personality_style
         FROM users u
         LEFT JOIN student_capabilities sc ON u.id = sc.student_id
         LEFT JOIN opc_assessments o ON u.id = o.student_id
         WHERE u.role = 'student' AND sc.id IS NULL
         LIMIT $1`,
        [limit]
      );

      const students = studentsResult.rows;
      logger.info(`Found ${students.length} students without capability`);

      let initialized = 0;
      for (const student of students) {
        try {
          const opcResults: OPCResults = {
            openness: student.openness || 50,
            persistence: student.persistence || 50,
            creativity: student.creativity || 50,
            personality_style: student.personality_style || 'unknown',
          };

          await this.initializeCapability(student.id, opcResults);
          initialized++;
        } catch (error: unknown) {
          logger.error(`Failed to initialize student ${student.id}:`, error);
        }
      }

      return initialized;
    } finally {
      client.release();
    }
  }
}

export default new StudentCapabilityService();
