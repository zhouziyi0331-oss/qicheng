import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import vectorGenerationService from './vectorGenerationService';

interface OPCResults {
  openness: number;
  persistence: number;
  creativity: number;
  personalityStyle: string;
}

interface TaskPerformance {
  taskId: string;
  quality: number;
  clientSatisfaction: number;
  onTime: boolean;
  responseTimeHours: number;
  skillsUsed: string[];
  completionDate: Date;
}

interface GrowthTrend {
  qualityTrend: 'improving' | 'stable' | 'declining';
  growthRate: number;
  skillAcquisitionRate: number;
  recentPerformance: number[];
}

/**
 * 学生能力更新服务
 * 基于任务完成情况动态更新学生能力画像
 */
class StudentCapabilityService {
  /**
   * 初始化学生能力画像
   */
  async initializeCapability(studentId: string, opcResults?: OPCResults): Promise<void> {
    try {
      // 检查是否已存在
      const existing = await queryOne(
        `SELECT id FROM student_capabilities WHERE student_id = $1`,
        [studentId]
      );

      if (existing) {
        logger.info(`Student capability already exists for ${studentId}`);
        return;
      }

      // 获取学生基本信息
      const student = await queryOne<{
        username: string;
        bio: string;
      }>(
        `SELECT username, bio FROM users WHERE id = $1`,
        [studentId]
      );

      if (!student) {
        throw new Error(`Student ${studentId} not found`);
      }

      // 创建初始能力记录
      await query(
        `INSERT INTO student_capabilities (
          student_id, skills, tasks_completed, avg_task_quality,
          avg_client_satisfaction, on_time_delivery_rate,
          avg_response_time_hours, quality_trend, growth_rate,
          skill_acquisition_rate, opc_openness, opc_persistence,
          opc_creativity, personality_style
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (student_id) DO NOTHING`,
        [
          studentId,
          JSON.stringify({}),
          0,
          0,
          0,
          0,
          24,
          'stable',
          0,
          0,
          opcResults?.openness || null,
          opcResults?.persistence || null,
          opcResults?.creativity || null,
          opcResults?.personalityStyle || null
        ]
      );

      // 生成初始向量
      await vectorGenerationService.updateStudentEmbedding(studentId);

      logger.info(`Initialized capability for student ${studentId}`);
    } catch (error) {
      logger.error(`Failed to initialize capability for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * 任务完成后更新学生能力
   */
  async updateAfterTaskCompletion(
    studentId: string,
    taskId: string,
    performance: TaskPerformance
  ): Promise<void> {
    try {
      // 获取当前能力数据
      const capability = await queryOne<{
        skills: any;
        tasks_completed: number;
        avg_task_quality: number;
        avg_client_satisfaction: number;
        on_time_delivery_rate: number;
        avg_response_time_hours: number;
      }>(
        `SELECT skills, tasks_completed, avg_task_quality, avg_client_satisfaction,
                on_time_delivery_rate, avg_response_time_hours
         FROM student_capabilities WHERE student_id = $1`,
        [studentId]
      );

      if (!capability) {
        // 如果不存在，先初始化
        await this.initializeCapability(studentId);
        return this.updateAfterTaskCompletion(studentId, taskId, performance);
      }

      const tasksCompleted = capability.tasks_completed || 0;
      const newTasksCompleted = tasksCompleted + 1;

      // 更新技能熟练度
      const updatedSkills = this.updateSkillProficiency(
        capability.skills || {},
        performance.skillsUsed,
        performance.quality
      );

      // 计算新的平均值（加权平均）
      const weight = Math.min(tasksCompleted / (tasksCompleted + 1), 0.9);
      const newAvgQuality = capability.avg_task_quality * weight + performance.quality * (1 - weight);
      const newAvgSatisfaction = capability.avg_client_satisfaction * weight + performance.clientSatisfaction * (1 - weight);

      // 更新准时交付率
      const onTimeCount = Math.round(capability.on_time_delivery_rate * tasksCompleted);
      const newOnTimeCount = onTimeCount + (performance.onTime ? 1 : 0);
      const newOnTimeRate = newOnTimeCount / newTasksCompleted;

      // 更新平均响应时间
      const newAvgResponseTime = capability.avg_response_time_hours * weight + performance.responseTimeHours * (1 - weight);

      // 计算成长趋势
      const growthTrend = await this.calculateGrowthTrend(studentId);

      // 更新数据库
      await query(
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
          growthTrend.qualityTrend,
          growthTrend.growthRate,
          growthTrend.skillAcquisitionRate,
          studentId
        ]
      );

      // 更新向量
      await vectorGenerationService.updateStudentEmbedding(studentId);

      logger.info(`Updated capability for student ${studentId} after task ${taskId}`);
    } catch (error) {
      logger.error(`Failed to update capability for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * 更新技能熟练度
   */
  private updateSkillProficiency(
    currentSkills: any,
    skillsUsed: string[],
    taskQuality: number
  ): any {
    const updatedSkills = { ...currentSkills };

    for (const skill of skillsUsed) {
      if (!updatedSkills[skill]) {
        // 新技能
        updatedSkills[skill] = {
          proficiency: taskQuality * 0.5, // 初始熟练度基于任务质量
          confidence: 0.3, // 初始信心较低
          lastPracticed: new Date().toISOString(),
          practiceCount: 1
        };
      } else {
        // 已有技能，提升熟练度
        const current = updatedSkills[skill];
        const practiceCount = (current.practiceCount || 0) + 1;

        // 熟练度增长：基于当前水平和任务质量
        const growthFactor = (1 - current.proficiency) * 0.1 * taskQuality;
        const newProficiency = Math.min(current.proficiency + growthFactor, 1);

        // 信心度增长：随着练习次数增加
        const newConfidence = Math.min(0.3 + practiceCount * 0.05, 1);

        updatedSkills[skill] = {
          proficiency: newProficiency,
          confidence: newConfidence,
          lastPracticed: new Date().toISOString(),
          practiceCount
        };
      }
    }

    return updatedSkills;
  }

  /**
   * 计算学生成长趋势
   */
  async calculateGrowthTrend(studentId: string): Promise<GrowthTrend> {
    try {
      // 获取最近10个任务的表现
      const recentTasks = await query<{
        quality: number;
        created_at: Date;
      }>(
        `SELECT
           COALESCE(tr.quality_score, 0.7) as quality,
           t.created_at
         FROM task_applications ta
         JOIN tasks t ON ta.task_id = t.id
         LEFT JOIN task_reviews tr ON tr.task_id = t.id AND tr.reviewer_id = t.company_id
         WHERE ta.student_id = $1 AND ta.status = 'completed'
         ORDER BY t.created_at DESC
         LIMIT 10`,
        [studentId]
      );

      if (recentTasks.length < 2) {
        return {
          qualityTrend: 'stable',
          growthRate: 0,
          skillAcquisitionRate: 0,
          recentPerformance: []
        };
      }

      const recentPerformance = recentTasks.map(t => t.quality);

      // 计算质量趋势（线性回归）
      const n = recentPerformance.length;
      const xMean = (n - 1) / 2;
      const yMean = recentPerformance.reduce((sum, val) => sum + val, 0) / n;

      let numerator = 0;
      let denominator = 0;

      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (recentPerformance[i] - yMean);
        denominator += (i - xMean) * (i - xMean);
      }

      const slope = denominator !== 0 ? numerator / denominator : 0;

      // 判断趋势
      let qualityTrend: 'improving' | 'stable' | 'declining';
      if (slope > 0.02) {
        qualityTrend = 'improving';
      } else if (slope < -0.02) {
        qualityTrend = 'declining';
      } else {
        qualityTrend = 'stable';
      }

      // 计算成长率（最近5个任务 vs 之前5个任务）
      let growthRate = 0;
      if (recentPerformance.length >= 6) {
        const recent5 = recentPerformance.slice(0, 5);
        const previous5 = recentPerformance.slice(5, 10);

        const recentAvg = recent5.reduce((sum, val) => sum + val, 0) / recent5.length;
        const previousAvg = previous5.reduce((sum, val) => sum + val, 0) / previous5.length;

        growthRate = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
      }

      // 计算技能获取率
      const capability = await queryOne<{ skills: any }>(
        `SELECT skills FROM student_capabilities WHERE student_id = $1`,
        [studentId]
      );

      const skills = capability?.skills || {};
      const totalSkills = Object.keys(skills).length;
      const tasksCompleted = recentTasks.length;

      const skillAcquisitionRate = tasksCompleted > 0 ? totalSkills / tasksCompleted : 0;

      return {
        qualityTrend,
        growthRate: Math.max(-1, Math.min(1, growthRate)),
        skillAcquisitionRate: Math.min(1, skillAcquisitionRate),
        recentPerformance
      };
    } catch (error) {
      logger.error(`Failed to calculate growth trend for student ${studentId}:`, error);
      return {
        qualityTrend: 'stable',
        growthRate: 0,
        skillAcquisitionRate: 0,
        recentPerformance: []
      };
    }
  }

  /**
   * 更新学生向量
   */
  async updateStudentVectors(studentId: string): Promise<void> {
    try {
      await vectorGenerationService.updateStudentEmbedding(studentId);
      logger.info(`Updated vectors for student ${studentId}`);
    } catch (error) {
      logger.error(`Failed to update vectors for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * 获取学生能力画像
   */
  async getStudentCapability(studentId: string): Promise<any> {
    try {
      const capability = await queryOne(
        `SELECT * FROM student_capabilities WHERE student_id = $1`,
        [studentId]
      );

      return capability;
    } catch (error) {
      logger.error(`Failed to get student capability for ${studentId}:`, error);
      return null;
    }
  }

  /**
   * 批量初始化所有学生的能力画像
   */
  async initializeAllStudents(): Promise<void> {
    try {
      const students = await query<{ id: string }>(
        `SELECT id FROM users WHERE role = 'student' AND status = 'active'`
      );

      logger.info(`Initializing capabilities for ${students.length} students`);

      for (const student of students) {
        try {
          await this.initializeCapability(student.id);
          // 避免API限流
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.error(`Failed to initialize student ${student.id}:`, error);
        }
      }

      logger.info(`Completed initializing ${students.length} students`);
    } catch (error) {
      logger.error('Failed to initialize all students:', error);
      throw error;
    }
  }

  /**
   * 更新学生的工作偏好
   */
  async updateWorkPreferences(
    studentId: string,
    preferences: {
      preferredTaskTypes?: string[];
      maxHoursPerWeek?: number;
      workStyle?: any;
    }
  ): Promise<void> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (preferences.preferredTaskTypes) {
        updates.push(`preferred_task_types = $${paramIndex++}`);
        values.push(preferences.preferredTaskTypes);
      }

      if (preferences.maxHoursPerWeek) {
        updates.push(`max_hours_per_week = $${paramIndex++}`);
        values.push(preferences.maxHoursPerWeek);
      }

      if (preferences.workStyle) {
        updates.push(`work_style = $${paramIndex++}`);
        values.push(JSON.stringify(preferences.workStyle));
      }

      if (updates.length === 0) {
        return;
      }

      updates.push(`updated_at = NOW()`);
      values.push(studentId);

      await query(
        `UPDATE student_capabilities SET ${updates.join(', ')} WHERE student_id = $${paramIndex}`,
        values
      );

      logger.info(`Updated work preferences for student ${studentId}`);
    } catch (error) {
      logger.error(`Failed to update work preferences for student ${studentId}:`, error);
      throw error;
    }
  }
}

export default new StudentCapabilityService();
