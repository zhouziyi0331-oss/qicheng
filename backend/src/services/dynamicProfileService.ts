import { aiServiceClient } from './aiServiceClient';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../utils/db';

interface UpdateProfileRequest {
  studentId: string;
  taskId: string;
  submissionId: string;
}

interface ProfileUpdateResponse {
  student_id: string;
  previous_profile: {
    opc_tag: string;
    capability_scores: {
      technical_depth: number;
      problem_solving: number;
      communication: number;
      collaboration: number;
      learning_agility: number;
      delivery_quality: number;
    };
  };
  updated_profile: {
    opc_tag: string;
    capability_scores: {
      technical_depth: number;
      problem_solving: number;
      communication: number;
      collaboration: number;
      learning_agility: number;
      delivery_quality: number;
    };
  };
  changes: {
    opc_tag_changed: boolean;
    significant_score_changes: Array<{
      dimension: string;
      old_score: number;
      new_score: number;
      change: number;
    }>;
  };
  insights: {
    strengths: string[];
    areas_for_improvement: string[];
    growth_trajectory: string;
    recommended_next_tasks: string[];
  };
  notification_sent: boolean;
  updated_at: string;
}

class DynamicProfileService {
  /**
   * 任务完成后更新学生能力画像
   */
  async updateAfterTaskCompletion(
    studentId: string,
    taskId: string,
    assignmentId: string
  ): Promise<ProfileUpdateResponse> {
    return this.updateStudentProfile(studentId, taskId, assignmentId);
  }

  /**
   * 任务完成后更新学生能力画像
   */
  async updateStudentProfile(
    studentId: string,
    taskId: string,
    submissionId: string
  ): Promise<ProfileUpdateResponse> {
    try {
      const result = await aiServiceClient.updateProfile({
        student_id: studentId,
        task_id: taskId,
        performance: {
          rating: 0,
          completion_time: 0,
        },
      });

      return result;
    } catch (error: any) {
      logger.error('Profile update failed:', error);
      throw new AppError(
        error.response?.status || 500,
        error.response?.data?.message || 'Failed to update student profile'
      );
    }
  }

  /**
   * 格式化画像更新结果为前端友好的格式
   */
  formatProfileUpdateForFrontend(response: ProfileUpdateResponse) {
    return {
      studentId: response.student_id,
      previousProfile: {
        opcTag: response.previous_profile.opc_tag,
        capabilityScores: response.previous_profile.capability_scores,
      },
      updatedProfile: {
        opcTag: response.updated_profile.opc_tag,
        capabilityScores: response.updated_profile.capability_scores,
      },
      changes: {
        opcTagChanged: response.changes.opc_tag_changed,
        significantScoreChanges: response.changes.significant_score_changes.map(change => ({
          dimension: change.dimension,
          oldScore: change.old_score,
          newScore: change.new_score,
          change: change.change,
        })),
      },
      insights: {
        strengths: response.insights.strengths,
        areasForImprovement: response.insights.areas_for_improvement,
        growthTrajectory: response.insights.growth_trajectory,
        recommendedNextTasks: response.insights.recommended_next_tasks,
      },
      notificationSent: response.notification_sent,
      updatedAt: response.updated_at,
    };
  }

  /**
   * 判断是否有显著变化需要通知学生
   */
  hasSignificantChanges(response: ProfileUpdateResponse): boolean {
    return (
      response.changes.opc_tag_changed ||
      response.changes.significant_score_changes.length > 0
    );
  }

  /**
   * 生成变化摘要文本
   */
  generateChangeSummary(response: ProfileUpdateResponse): string {
    const parts: string[] = [];

    if (response.changes.opc_tag_changed) {
      parts.push(
        `你的学习类型从 ${response.previous_profile.opc_tag} 变更为 ${response.updated_profile.opc_tag}`
      );
    }

    if (response.changes.significant_score_changes.length > 0) {
      const improvements = response.changes.significant_score_changes.filter(c => c.change > 0);
      const declines = response.changes.significant_score_changes.filter(c => c.change < 0);

      if (improvements.length > 0) {
        const dimensions = improvements.map(c => this.translateDimension(c.dimension)).join('、');
        parts.push(`${dimensions} 能力有显著提升`);
      }

      if (declines.length > 0) {
        const dimensions = declines.map(c => this.translateDimension(c.dimension)).join('、');
        parts.push(`${dimensions} 需要更多关注`);
      }
    }

    return parts.join('；');
  }

  /**
   * 翻译能力维度名称
   */
  private translateDimension(dimension: string): string {
    const translations: Record<string, string> = {
      technical_depth: '技术深度',
      problem_solving: '问题解决',
      communication: '沟通表达',
      collaboration: '团队协作',
      learning_agility: '学习敏捷度',
      delivery_quality: '交付质量',
    };

    return translations[dimension] || dimension;
  }

  /**
   * 批量更新多个学生的能力画像
   */
  async batchUpdate(updates: Array<{ studentId: string; taskId: string; submissionId: string }>): Promise<ProfileUpdateResponse[]> {
    try {
      const results = await Promise.all(
        updates.map(update =>
          this.updateStudentProfile(update.studentId, update.taskId, update.submissionId)
        )
      );

      return results;
    } catch (error: any) {
      logger.error('Batch profile update failed:', error);
      throw new AppError(
        error.response?.status || 500,
        error.response?.data?.message || 'Failed to batch update profiles'
      );
    }
  }

  /**
   * 获取学生的能力画像历史记录
   */
  async getProfileHistory(studentId: string, limit: number = 20): Promise<any[]> {
    try {
      const query = `
        SELECT
          id,
          student_id,
          task_id,
          submission_id,
          previous_profile,
          updated_profile,
          changes,
          insights,
          created_at
        FROM profile_history
        WHERE student_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [studentId, limit]);

      return result.rows.map((record: any) => ({
        id: record.id,
        studentId: record.student_id,
        taskId: record.task_id,
        submissionId: record.submission_id,
        previousProfile: {
          opcTag: record.previous_profile.opc_tag,
          capabilityScores: record.previous_profile.capability_scores,
        },
        updatedProfile: {
          opcTag: record.updated_profile.opc_tag,
          capabilityScores: record.updated_profile.capability_scores,
        },
        changes: {
          opcTagChanged: record.changes.opc_tag_changed,
          significantScoreChanges: record.changes.significant_score_changes.map((change: any) => ({
            dimension: change.dimension,
            oldScore: change.old_score,
            newScore: change.new_score,
            change: change.change,
          })),
        },
        insights: {
          strengths: record.insights.strengths,
          areasForImprovement: record.insights.areas_for_improvement,
          growthTrajectory: record.insights.growth_trajectory,
          recommendedNextTasks: record.insights.recommended_next_tasks,
        },
        createdAt: record.created_at,
      }));
    } catch (error) {
      logger.error('Failed to get profile history:', error);
      throw new AppError(500, 'Failed to get profile history');
    }
  }
}

export const dynamicProfileService = new DynamicProfileService();
