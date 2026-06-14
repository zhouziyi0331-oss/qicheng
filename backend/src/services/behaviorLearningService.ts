import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';

/**
 * 学生行为学习服务
 * 记录学生行为，动态学习偏好，影响推荐结果
 */

interface BehaviorLog {
  studentId: string;
  taskId: string;
  actionType: 'viewed' | 'accepted' | 'rejected' | 'completed' | 'failed';
  taskType?: string;
  taskTrack?: string;
  taskLevel?: number;
  taskBudget?: number;
  taskTags?: string[];
  matchScore?: number;
  rankInRecommendation?: number;
}

interface PreferenceProfile {
  studentId: string;
  preferredTaskTypes: Record<string, { acceptanceRate: number; avgCompletionQuality: number; count: number }>;
  preferredBudgetRange: { min: number; max: number; avgAccepted: number };
  preferredDifficultyRange: { minLevel: number; maxLevel: number; comfortZone: number };
  rejectionPatterns: Record<string, number>;
  totalViewed: number;
  totalAccepted: number;
  totalRejected: number;
  totalCompleted: number;
  acceptanceRate: number;
  completionRate: number;
}

class BehaviorLearningService {
  /**
   * 记录学生行为
   */
  async logBehavior(log: BehaviorLog): Promise<void> {
    try {
      await query(
        `INSERT INTO student_behavior_logs (
          student_id, task_id, action_type,
          task_type, task_track, task_level, task_budget, task_tags,
          match_score, rank_in_recommendation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (student_id, task_id, action_type) DO NOTHING`,
        [
          log.studentId,
          log.taskId,
          log.actionType,
          log.taskType,
          log.taskTrack,
          log.taskLevel,
          log.taskBudget,
          log.taskTags,
          log.match_score,
          log.rankInRecommendation,
        ]
      );

      logger.info(`Logged behavior: ${log.actionType} for student ${log.studentId} on task ${log.taskId}`);

      // 如果是接受或拒绝行为，分析原因并更新偏好
      if (log.actionType === 'accepted' || log.actionType === 'rejected') {
        await this.analyzeAndUpdatePreference(log);
      }
    } catch (error: any) {
      logger.error('Failed to log behavior:', error);
      throw error;
    }
  }

  /**
   * 分析行为并更新偏好画像
   */
  private async analyzeAndUpdatePreference(log: BehaviorLog): Promise<void> {
    try {
      // 获取当前偏好画像
      const profile = await this.getPreferenceProfile(log.studentId);

      if (!profile) {
        logger.warn(`No preference profile found for student ${log.studentId}`);
        return;
      }

      // 更新任务类型偏好
      if (log.taskType) {
        const taskTypePrefs = profile.preferredTaskTypes || {};
        const currentPref = taskTypePrefs[log.taskType] || { acceptanceRate: 0, avgCompletionQuality: 0, count: 0 };

        if (log.actionType === 'accepted') {
          currentPref.count += 1;
          currentPref.acceptanceRate = (currentPref.acceptanceRate * (currentPref.count - 1) + 1) / currentPref.count;
        } else if (log.actionType === 'rejected') {
          currentPref.count += 1;
          currentPref.acceptanceRate = (currentPref.acceptanceRate * (currentPref.count - 1)) / currentPref.count;
        }

        taskTypePrefs[log.taskType] = currentPref;

        await query(
          `UPDATE student_preference_profiles
           SET preferred_task_types = $1, updated_at = NOW()
           WHERE student_id = $2`,
          [JSON.stringify(taskTypePrefs), log.studentId]
        );
      }

      // 更新预算偏好
      if (log.taskBudget && log.actionType === 'accepted') {
        const budgetRange = profile.preferredBudgetRange || { min: 0, max: 0, avgAccepted: 0 };
        const totalAccepted = profile.totalAccepted || 1;

        budgetRange.min = budgetRange.min === 0 ? log.taskBudget : Math.min(budgetRange.min, log.taskBudget);
        budgetRange.max = Math.max(budgetRange.max, log.taskBudget);
        budgetRange.avgAccepted = (budgetRange.avgAccepted * (totalAccepted - 1) + log.taskBudget) / totalAccepted;

        await query(
          `UPDATE student_preference_profiles
           SET preferred_budget_range = $1, updated_at = NOW()
           WHERE student_id = $2`,
          [JSON.stringify(budgetRange), log.studentId]
        );
      }

      // 更新难度偏好
      if (log.taskLevel && log.actionType === 'accepted') {
        const difficultyRange = profile.preferredDifficultyRange || { minLevel: 0, maxLevel: 0, comfortZone: 0 };
        const totalAccepted = profile.totalAccepted || 1;

        difficultyRange.minLevel = difficultyRange.minLevel === 0 ? log.taskLevel : Math.min(difficultyRange.minLevel, log.taskLevel);
        difficultyRange.maxLevel = Math.max(difficultyRange.maxLevel, log.taskLevel);
        difficultyRange.comfortZone = Math.round((difficultyRange.comfortZone * (totalAccepted - 1) + log.taskLevel) / totalAccepted);

        await query(
          `UPDATE student_preference_profiles
           SET preferred_difficulty_range = $1, updated_at = NOW()
           WHERE student_id = $2`,
          [JSON.stringify(difficultyRange), log.studentId]
        );
      }

      // 分析拒绝原因
      if (log.actionType === 'rejected') {
        await this.analyzeRejectionReason(log, profile);
      }
    } catch (error: any) {
      logger.error('Failed to analyze and update preference:', error);
    }
  }

  /**
   * 分析拒绝原因
   */
  private async analyzeRejectionReason(log: BehaviorLog, profile: PreferenceProfile): Promise<void> {
    const rejectionPatterns = profile.rejectionPatterns || {};

    // 预算过低
    if (log.taskBudget && profile.preferredBudgetRange?.avgAccepted) {
      if (log.taskBudget < profile.preferredBudgetRange.avgAccepted * 0.7) {
        rejectionPatterns['too_low_budget'] = (rejectionPatterns['too_low_budget'] || 0) + 1;
      }
    }

    // 难度过高
    if (log.taskLevel && profile.preferredDifficultyRange?.comfortZone) {
      if (log.taskLevel > profile.preferredDifficultyRange.comfortZone + 2) {
        rejectionPatterns['too_high_difficulty'] = (rejectionPatterns['too_high_difficulty'] || 0) + 1;
      }
    }

    // 不熟悉的领域
    if (log.taskType && profile.preferredTaskTypes) {
      const taskTypePref = profile.preferredTaskTypes[log.taskType];
      if (!taskTypePref || taskTypePref.count === 0) {
        rejectionPatterns['unfamiliar_domain'] = (rejectionPatterns['unfamiliar_domain'] || 0) + 1;
      }
    }

    await query(
      `UPDATE student_preference_profiles
       SET rejection_patterns = $1, updated_at = NOW()
       WHERE student_id = $2`,
      [JSON.stringify(rejectionPatterns), log.studentId]
    );
  }

  /**
   * 获取学生偏好画像
   */
  async getPreferenceProfile(studentId: string): Promise<PreferenceProfile | null> {
    try {
      const result = await queryOne<{
        student_id: string;
        preferred_task_types: any;
        preferred_budget_range: any;
        preferred_difficulty_range: any;
        rejection_patterns: any;
        total_viewed: number;
        total_accepted: number;
        total_rejected: number;
        total_completed: number;
        acceptance_rate: number;
        completion_rate: number;
      }>(
        `SELECT * FROM student_preference_profiles WHERE student_id = $1`,
        [studentId]
      );

      if (!result) {
        return null;
      }

      return {
        studentId: result.student_id,
        preferredTaskTypes: result.preferred_task_types || {},
        preferredBudgetRange: result.preferred_budget_range || {},
        preferredDifficultyRange: result.preferred_difficulty_range || {},
        rejectionPatterns: result.rejection_patterns || {},
        totalViewed: result.total_viewed || 0,
        totalAccepted: result.total_accepted || 0,
        totalRejected: result.total_rejected || 0,
        totalCompleted: result.total_completed || 0,
        acceptanceRate: result.acceptance_rate || 0,
        completionRate: result.completion_rate || 0,
      };
    } catch (error: any) {
      logger.error(`Failed to get preference profile for student ${studentId}:`, error);
      return null;
    }
  }

  /**
   * 计算基于行为的偏好加权
   * 用于调整匹配分数
   */
  async calculatePreferenceBoost(studentId: string, taskType: string, taskBudget: number, taskLevel: number): Promise<number> {
    try {
      const profile = await this.getPreferenceProfile(studentId);

      if (!profile) {
        return 0; // 没有行为数据，不调整
      }

      let boost = 0;

      // 1. 任务类型偏好加权
      if (profile.preferredTaskTypes[taskType]) {
        const typePref = profile.preferredTaskTypes[taskType];
        if (typePref.acceptanceRate > 0.7 && typePref.count >= 3) {
          boost += 0.1; // 喜欢的类型，加10%
        } else if (typePref.acceptanceRate < 0.3 && typePref.count >= 3) {
          boost -= 0.1; // 不喜欢的类型，减10%
        }
      }

      // 2. 预算偏好加权
      if (profile.preferredBudgetRange?.avgAccepted) {
        const budgetDiff = Math.abs(taskBudget - profile.preferredBudgetRange.avgAccepted) / profile.preferredBudgetRange.avgAccepted;
        if (budgetDiff < 0.2) {
          boost += 0.05; // 预算接近偏好，加5%
        } else if (budgetDiff > 0.5) {
          boost -= 0.05; // 预算偏离太多，减5%
        }
      }

      // 3. 难度偏好加权
      if (profile.preferredDifficultyRange?.comfortZone) {
        const levelDiff = Math.abs(taskLevel - profile.preferredDifficultyRange.comfortZone);
        if (levelDiff <= 1) {
          boost += 0.05; // 难度在舒适区，加5%
        } else if (levelDiff > 2) {
          boost -= 0.05; // 难度偏离太多，减5%
        }
      }

      // 限制boost范围在 [-0.2, 0.2]
      return Math.max(-0.2, Math.min(0.2, boost));
    } catch (error: any) {
      logger.error('Failed to calculate preference boost:', error);
      return 0;
    }
  }

  /**
   * 记录任务查看行为
   */
  async logTaskView(studentId: string, taskId: string, matchScore?: number, rank?: number): Promise<void> {
    // 获取任务信息
    const task = await queryOne<{
      task_type: string;
      track: string;
      level_required: number;
      budget_gross: number;
    }>(
      `SELECT task_type, track, level_required, budget_gross FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return;
    }

    await this.logBehavior({
      studentId,
      taskId,
      actionType: 'viewed',
      taskType: task.task_type,
      taskTrack: task.track,
      taskLevel: task.level_required,
      taskBudget: task.budget_gross,
      match_score,
      rankInRecommendation: rank,
    });
  }

  /**
   * 记录任务接受行为
   */
  async logTaskAccept(studentId: string, taskId: string): Promise<void> {
    const task = await queryOne<{
      task_type: string;
      track: string;
      level_required: number;
      budget_gross: number;
    }>(
      `SELECT task_type, track, level_required, budget_gross FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return;
    }

    await this.logBehavior({
      studentId,
      taskId,
      actionType: 'accepted',
      taskType: task.task_type,
      taskTrack: task.track,
      taskLevel: task.level_required,
      taskBudget: task.budget_gross,
    });
  }

  /**
   * 记录任务拒绝行为
   */
  async logTaskReject(studentId: string, taskId: string): Promise<void> {
    const task = await queryOne<{
      task_type: string;
      track: string;
      level_required: number;
      budget_gross: number;
    }>(
      `SELECT task_type, track, level_required, budget_gross FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return;
    }

    await this.logBehavior({
      studentId,
      taskId,
      actionType: 'rejected',
      taskType: task.task_type,
      taskTrack: task.track,
      taskLevel: task.level_required,
      taskBudget: task.budget_gross,
    });
  }

  /**
   * 记录任务完成行为
   */
  async logTaskComplete(studentId: string, taskId: string): Promise<void> {
    const task = await queryOne<{
      task_type: string;
      track: string;
      level_required: number;
      budget_gross: number;
    }>(
      `SELECT task_type, track, level_required, budget_gross FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (!task) {
      return;
    }

    await this.logBehavior({
      studentId,
      taskId,
      actionType: 'completed',
      taskType: task.task_type,
      taskTrack: task.track,
      taskLevel: task.level_required,
      taskBudget: task.budget_gross,
    });
  }
}

export default new BehaviorLearningService();
