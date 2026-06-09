import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';

/**
 * AI导师上下文增强服务
 *
 * 核心原则：让AI导师的每句话都有真实数据支撑
 * - 查得到就引用，查不到就不编造
 * - 所有引用都能追溯到数据库记录
 */

interface RealStuckCase {
  observation_content: string;
  context: any;
  student_level?: number;
  time_stuck_days?: number;
}

interface LastMessage {
  content: string;
  created_at: Date;
}

interface GrowthComparison {
  initial_gaps: string[];
  current_skills: string[];
  gaps_closed: string[];
  client_feedback?: {
    rating: number;
    comment: string;
  };
}

class MentorContextEnhancer {
  /**
   * T-02: 获取真实的同类卡点案例
   *
   * @param studentId 当前学生ID
   * @param taskId 当前任务ID
   * @returns 真实案例或null（查不到不编造）
   */
  async getRealStuckCase(studentId: string, taskId: string): Promise<RealStuckCase | null> {
    try {
      // 1. 获取当前任务的赛道
      const taskInfo = await queryOne<{ track: string }>(
        `SELECT track
         FROM tasks
         WHERE id = $1`,
        [taskId]
      );

      if (!taskInfo) {
        logger.warn(`Task ${taskId} not found for stuck case query`);
        return null;
      }

      // 2. 查询同赛道的真实卡点案例
      const cases = await query<{
        observation_content: string;
        context: any;
      }>(
        `SELECT
           mgo.observation_content,
           mgo.context
         FROM mentor_growth_observations mgo
         JOIN task_assignments ta ON mgo.task_id = ta.id
         JOIN tasks t ON ta.task_id = t.id
         WHERE mgo.observation_type = 'stuck'
           AND t.track = $1
           AND mgo.student_id != $2
           AND mgo.observation_content IS NOT NULL
           AND mgo.observation_content != ''
         ORDER BY RANDOM()
         LIMIT 1`,
        [taskInfo.track, studentId]
      );

      if (cases.length === 0) {
        logger.info(`No real stuck case found for track ${taskInfo.track}`);
        return null;
      }

      const realCase = cases[0];
      logger.info('Found real stuck case', {
        track: taskInfo.track,
        hasContext: !!realCase.context
      });

      return {
        observation_content: realCase.observation_content,
        context: realCase.context
      };

    } catch (error) {
      logger.error('Failed to get real stuck case:', error);
      return null;
    }
  }

  /**
   * T-04: 获取学生在该任务的最近一条消息
   *
   * @param taskId 任务ID
   * @returns 最近消息或null
   */
  async getLastStudentMessage(taskId: string): Promise<LastMessage | null> {
    try {
      const messages = await query<{
        content: string;
        created_at: Date;
      }>(
        `SELECT mm.content, mm.created_at
         FROM mentor_messages mm
         JOIN mentor_sessions ms ON mm.session_id = ms.id
         WHERE ms.task_id = $1
           AND mm.role = 'student'
           AND mm.content IS NOT NULL
           AND mm.content != ''
         ORDER BY mm.created_at DESC
         LIMIT 1`,
        [taskId]
      );

      if (messages.length === 0) {
        logger.info(`No student message found for task ${taskId}`);
        return null;
      }

      const lastMessage = messages[0];
      logger.info('Found last student message', {
        taskId,
        messageLength: lastMessage.content.length,
        timeSince: this.calculateTimeSince(lastMessage.created_at)
      });

      return {
        content: lastMessage.content,
        created_at: lastMessage.created_at
      };

    } catch (error) {
      logger.error('Failed to get last student message:', error);
      return null;
    }
  }

  /**
   * T-05: 获取学生成长对比数据（入驻时vs现在）
   *
   * @param studentId 学生ID
   * @param assignmentId 任务分配ID (task_assignments.id)
   * @returns 成长对比数据
   */
  async getGrowthComparison(studentId: string, assignmentId: string): Promise<GrowthComparison> {
    try {
      // 1. 查入驻时的能力画像（从最早的画像）
      const initialProfile = await queryOne<{
        information_processing: number;
        creative_drive: number;
        tool_learning: number;
        task_execution: number;
        collaboration_tendency: number;
        profile_summary: string;
      }>(
        `SELECT
           information_processing,
           creative_drive,
           tool_learning,
           task_execution,
           collaboration_tendency,
           profile_summary
         FROM user_ability_profiles
         WHERE user_id = $1
           AND is_current = false
         ORDER BY created_at ASC
         LIMIT 1`,
        [studentId]
      );

      // 从profile_summary中提取能力缺口关键词
      const initialGaps: string[] = [];
      if (initialProfile?.profile_summary) {
        // 简单提取：查找"需要提升"、"缺乏"、"较弱"等关键词后的内容
        const summary = initialProfile.profile_summary;
        if (summary.includes('需要提升')) initialGaps.push('需要提升的能力');
        if (summary.includes('缺乏')) initialGaps.push('缺乏经验的领域');
        if (initialProfile.information_processing < 60) initialGaps.push('信息处理能力');
        if (initialProfile.creative_drive < 60) initialGaps.push('创造力驱动');
        if (initialProfile.tool_learning < 60) initialGaps.push('工具学习能力');
        if (initialProfile.task_execution < 60) initialGaps.push('任务执行能力');
      }

      // 2. 查本单展示的skills（从成长观察）
      const observations = await query<{
        skills_demonstrated: any;
        observation_content: string;
      }>(
        `SELECT skills_demonstrated, observation_content
         FROM mentor_growth_observations
         WHERE task_id = $1
           AND observation_type IN ('skill_shown', 'breakthrough')
           AND skills_demonstrated IS NOT NULL`,
        [assignmentId]
      );

      const currentSkills: string[] = observations.flatMap(obs =>
        Array.isArray(obs.skills_demonstrated) ? obs.skills_demonstrated : []
      );

      // 3. 查当前能力画像
      const currentProfile = await queryOne<{
        information_processing: number;
        creative_drive: number;
        tool_learning: number;
        task_execution: number;
      }>(
        `SELECT
           information_processing,
           creative_drive,
           tool_learning,
           task_execution
         FROM user_ability_profiles
         WHERE user_id = $1
           AND is_current = true
         LIMIT 1`,
        [studentId]
      );

      // 4. 对比找出进步的维度
      const gapsClosed: string[] = [];
      if (initialProfile && currentProfile) {
        if (initialProfile.information_processing < 60 && currentProfile.information_processing >= 60) {
          gapsClosed.push('信息处理能力有明显提升');
        }
        if (initialProfile.creative_drive < 60 && currentProfile.creative_drive >= 60) {
          gapsClosed.push('创造力驱动有明显提升');
        }
        if (initialProfile.tool_learning < 60 && currentProfile.tool_learning >= 60) {
          gapsClosed.push('工具学习能力有明显提升');
        }
        if (initialProfile.task_execution < 60 && currentProfile.task_execution >= 60) {
          gapsClosed.push('任务执行能力有明显提升');
        }
      }

      // 5. 查客户评价（额外证据）
      const assignmentInfo = await queryOne<{
        rating: number;
        review_comment: string;
      }>(
        `SELECT
           tr.rating,
           tr.comment as review_comment
         FROM task_assignments ta
         LEFT JOIN task_reviews tr ON ta.task_id = tr.task_id AND ta.student_id::text = tr.reviewee_id
         WHERE ta.id = $1`,
        [assignmentId]
      );

      const result: GrowthComparison = {
        initial_gaps: initialGaps,
        current_skills: currentSkills,
        gaps_closed: gapsClosed
      };

      if (assignmentInfo?.rating) {
        result.client_feedback = {
          rating: assignmentInfo.rating,
          comment: assignmentInfo.review_comment || ''
        };
      }

      logger.info('Growth comparison generated', {
        studentId,
        assignmentId,
        initialGapsCount: initialGaps.length,
        currentSkillsCount: currentSkills.length,
        gapsClosedCount: gapsClosed.length
      });

      return result;

    } catch (error) {
      logger.error('Failed to get growth comparison:', error);
      // 返回空对象，不抛出异常
      return {
        initial_gaps: [],
        current_skills: [],
        gaps_closed: []
      };
    }
  }

  /**
   * 计算时间间隔（用于轻推消息）
   */
  private calculateTimeSince(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}天前`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前`;
    } else {
      return '刚才';
    }
  }

  /**
   * 获取时间间隔的小时数（数字）
   */
  getHoursSince(timestamp: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }
}

export default new MentorContextEnhancer();
