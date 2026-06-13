import { pool } from '../config/database';
import logger from '../utils/logger';
import { mentorStageService } from './mentorStageService';
import { humanizedConversationService } from './humanizedConversationService';

interface FollowUpTask {
  sessionId: number;
  studentId: number;
  taskId: number;
  reason: string;
  scheduledAt: Date;
  priority: 'low' | 'medium' | 'high';
}

interface FollowUpMessage {
  content: string;
  tone: string;
  shouldSend: boolean;
}

class ProactiveFollowUpService {
  /**
   * 检查需要跟进的学生
   */
  async checkFollowUps(): Promise<FollowUpTask[]> {
    try {
      const tasks: FollowUpTask[] = [];

      // 1. 检查长时间没有回复的学生
      const inactiveSessions = await this.findInactiveSessions();
      tasks.push(...inactiveSessions);

      // 2. 检查遇到困难但没有解决的学生
      const strugglingStudents = await this.findStrugglingStudents();
      tasks.push(...strugglingStudents);

      // 3. 检查推荐了工具但没有反馈的学生
      const toolFollowUps = await this.findToolFollowUps();
      tasks.push(...toolFollowUps);

      // 4. 检查达成里程碑但没有庆祝的学生
      const uncelebratedMilestones = await this.findUncelebratedMilestones();
      tasks.push(...uncelebratedMilestones);

      return tasks;
    } catch (error: unknown) {
      logger.error('检查跟进任务失败', { error });
      return [];
    }
  }

  /**
   * 生成跟进消息
   */
  async generateFollowUpMessage(
    sessionId: number,
    studentId: number,
    reason: string
  ): Promise<FollowUpMessage> {
    try {
      // 获取会话信息
      const session = await mentorStageService.getSession(sessionId.toString());
      if (!session) {
        return {
          content: '',
          tone: 'neutral',
          shouldSend: false
        };
      }

      // 获取对话历史
      const messages = await mentorStageService.getMessages(sessionId.toString(), 10);
      const conversationHistory = messages.reverse().map(m => ({
        role: m.role,
        content: m.content
      }));

      // 获取人性化上下文
      const humanizedContext = await this.getHumanizedContext(sessionId);

      // 根据原因生成不同的跟进消息
      let message = '';
      let tone = 'caring';

      switch (reason) {
        case 'inactive':
          message = await this.generateInactiveFollowUp(
            studentId,
            conversationHistory,
            humanizedContext
          );
          break;

        case 'struggling':
          message = await this.generateStrugglingFollowUp(
            studentId,
            conversationHistory,
            humanizedContext
          );
          tone = 'supportive';
          break;

        case 'tool_feedback':
          message = await this.generateToolFollowUp(
            studentId,
            conversationHistory,
            humanizedContext
          );
          tone = 'curious';
          break;

        case 'celebrate':
          message = await this.generateCelebrationFollowUp(
            studentId,
            conversationHistory,
            humanizedContext
          );
          tone = 'excited';
          break;

        default:
          message = '嘿，最近怎么样？有什么我能帮到你的吗？';
      }

      return {
        content: message,
        tone,
        shouldSend: message.length > 0
      };
    } catch (error: unknown) {
      logger.error('生成跟进消息失败', { error, sessionId });
      return {
        content: '',
        tone: 'neutral',
        shouldSend: false
      };
    }
  }

  /**
   * 发送跟进消息
   */
  async sendFollowUp(sessionId: number, message: string): Promise<boolean> {
    try {
      await mentorStageService.saveMessage(
        sessionId.toString(),
        'mentor',
        message,
        {
          extra: {
            isProactiveFollowUp: true,
            sentAt: new Date().toISOString()
          }
        }
      );

      // 更新人性化上下文
      await pool.query(
        `UPDATE mentor_humanized_context
         SET follow_up_needed = false,
             updated_at = NOW()
         WHERE session_id = $1`,
        [sessionId]
      );

      return true;
    } catch (error: unknown) {
      logger.error('发送跟进消息失败', { error, sessionId });
      return false;
    }
  }

  /**
   * 查找不活跃的会话（24小时没有回复）
   */
  private async findInactiveSessions(): Promise<FollowUpTask[]> {
    try {
      const query = `
        SELECT
          s.id as session_id,
          s.student_id,
          s.task_id,
          MAX(m.created_at) as last_message_at
        FROM mentor_stage_sessions s
        JOIN mentor_stage_messages m ON s.id = m.session_id
        WHERE s.stage_status = 'in_progress'
          AND m.role = 'student'
        GROUP BY s.id, s.student_id, s.task_id
        HAVING MAX(m.created_at) < NOW() - INTERVAL '24 hours'
          AND MAX(m.created_at) > NOW() - INTERVAL '48 hours'
      `;

      const result = await pool.query(query);

      return result.rows.map(row => ({
        sessionId: row.session_id,
        studentId: row.student_id,
        taskId: row.task_id,
        reason: 'inactive',
        scheduledAt: new Date(),
        priority: 'medium'
      }));
    } catch (error: unknown) {
      logger.error('查找不活跃会话失败', { error });
      return [];
    }
  }

  /**
   * 查找遇到困难的学生（记录了困难但没有解决）
   */
  private async findStrugglingStudents(): Promise<FollowUpTask[]> {
    try {
      const query = `
        SELECT DISTINCT
          s.id as session_id,
          s.student_id,
          s.task_id,
          st.created_at
        FROM mentor_stage_sessions s
        JOIN mentor_student_specific_struggles st ON s.student_id = st.student_id AND s.task_id = st.task_id
        WHERE s.stage_status = 'in_progress'
          AND st.resolved = false
          AND st.created_at > NOW() - INTERVAL '48 hours'
          AND st.created_at < NOW() - INTERVAL '12 hours'
      `;

      const result = await pool.query(query);

      return result.rows.map(row => ({
        sessionId: row.session_id,
        studentId: row.student_id,
        taskId: row.task_id,
        reason: 'struggling',
        scheduledAt: new Date(),
        priority: 'high'
      }));
    } catch (error: unknown) {
      logger.error('查找困难学生失败', { error });
      return [];
    }
  }

  /**
   * 查找需要工具反馈的学生
   */
  private async findToolFollowUps(): Promise<FollowUpTask[]> {
    try {
      const query = `
        SELECT DISTINCT
          s.id as session_id,
          s.student_id,
          s.task_id,
          t.recommended_at
        FROM mentor_stage_sessions s
        JOIN mentor_tool_usage_tracking t ON s.student_id = t.student_id AND s.task_id = t.task_id
        WHERE s.stage_status = 'in_progress'
          AND t.student_tried = false
          AND t.recommended_at > NOW() - INTERVAL '48 hours'
          AND t.recommended_at < NOW() - INTERVAL '24 hours'
      `;

      const result = await pool.query(query);

      return result.rows.map(row => ({
        sessionId: row.session_id,
        studentId: row.student_id,
        taskId: row.task_id,
        reason: 'tool_feedback',
        scheduledAt: new Date(),
        priority: 'low'
      }));
    } catch (error: unknown) {
      logger.error('查找工具跟进失败', { error });
      return [];
    }
  }

  /**
   * 查找未庆祝的里程碑
   */
  private async findUncelebratedMilestones(): Promise<FollowUpTask[]> {
    try {
      const query = `
        SELECT DISTINCT
          s.id as session_id,
          s.student_id,
          s.task_id,
          m.created_at
        FROM mentor_stage_sessions s
        JOIN student_growth_milestones m ON s.student_id = m.student_id AND s.task_id = m.task_id
        WHERE s.stage_status = 'in_progress'
          AND m.celebrated = false
          AND m.created_at > NOW() - INTERVAL '24 hours'
          AND m.created_at < NOW() - INTERVAL '2 hours'
      `;

      const result = await pool.query(query);

      return result.rows.map(row => ({
        sessionId: row.session_id,
        studentId: row.student_id,
        taskId: row.task_id,
        reason: 'celebrate',
        scheduledAt: new Date(),
        priority: 'medium'
      }));
    } catch (error: unknown) {
      logger.error('查找未庆祝里程碑失败', { error });
      return [];
    }
  }

  /**
   * 生成不活跃跟进消息
   */
  private async generateInactiveFollowUp(
    studentId: number,
    conversationHistory: any[],
    humanizedContext: any
  ): Promise<string> {
    const lastStudentMessage = conversationHistory
      .filter(m => m.role === 'student')
      .pop();

    if (!lastStudentMessage) {
      return '嘿，好久不见！最近怎么样？任务进展还顺利吗？';
    }

    const messages = [
      `嘿，上次你说"${lastStudentMessage.content.substring(0, 30)}..."，后来怎么样了？`,
      '好久没听到你的消息了，是遇到什么困难了吗？我一直在这儿呢。',
      '想起你了，任务进展还好吗？有什么需要帮忙的随时说。',
      '嗨～最近忙吗？如果遇到什么问题，记得来找我聊聊。'
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * 生成困难跟进消息
   */
  private async generateStrugglingFollowUp(
    studentId: number,
    conversationHistory: any[],
    humanizedContext: any
  ): Promise<string> {
    // 获取具体困难
    const struggle = await pool.query(
      `SELECT struggle_description, student_original_words
       FROM mentor_student_specific_struggles
       WHERE student_id = $1 AND resolved = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId]
    );

    if (struggle.rows.length === 0) {
      return '';
    }

    const { struggle_description, student_original_words } = struggle.rows[0];

    return `嘿，我一直在想你上次说的"${student_original_words}"。

那个问题解决了吗？如果还卡着，我们一起再想想办法。

或者你已经找到方法了？跟我说说呗，我也想知道你是怎么解决的。`;
  }

  /**
   * 生成工具跟进消息
   */
  private async generateToolFollowUp(
    studentId: number,
    conversationHistory: any[],
    humanizedContext: any
  ): Promise<string> {
    // 获取推荐的工具
    const tool = await pool.query(
      `SELECT t.tool_name
       FROM mentor_tool_usage_tracking u
       JOIN mentor_tool_recommendations t ON u.tool_id = t.id
       WHERE u.student_id = $1 AND u.student_tried = false
       ORDER BY u.recommended_at DESC
       LIMIT 1`,
      [studentId]
    );

    if (tool.rows.length === 0) {
      return '';
    }

    const toolName = tool.rows[0].tool_name;

    return `对了，上次推荐你试试${toolName}，你试了吗？

如果用的时候遇到什么问题，随时跟我说。
或者如果觉得不太适合，我们也可以换个其他的工具。

你的感受最重要～`;
  }

  /**
   * 生成庆祝跟进消息
   */
  private async generateCelebrationFollowUp(
    studentId: number,
    conversationHistory: any[],
    humanizedContext: any
  ): Promise<string> {
    // 获取里程碑
    const milestone = await pool.query(
      `SELECT milestone_title, milestone_description, celebration_message
       FROM student_growth_milestones
       WHERE student_id = $1 AND celebrated = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [studentId]
    );

    if (milestone.rows.length === 0) {
      return '';
    }

    const { milestone_title, celebration_message } = milestone.rows[0];

    if (celebration_message) {
      return celebration_message;
    }

    return `嘿！我注意到你${milestone_title}了！

这真的很棒，我为你感到高兴！🎉

你自己有没有感觉到这个变化？`;
  }

  /**
   * 获取人性化上下文
   */
  private async getHumanizedContext(sessionId: number): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT * FROM mentor_humanized_context WHERE session_id = $1',
        [sessionId]
      );
      return result.rows[0] || null;
    } catch (error: unknown) {
      logger.error('获取人性化上下文失败', { error, sessionId });
      return null;
    }
  }

  /**
   * 执行所有跟进任务（定时任务）
   */
  async executeFollowUps(): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    try {
      const tasks = await this.checkFollowUps();
      let sent = 0;
      let failed = 0;

      for (const task of tasks) {
        const message = await this.generateFollowUpMessage(
          task.sessionId,
          task.studentId,
          task.reason
        );

        if (message.shouldSend) {
          const success = await this.sendFollowUp(task.sessionId, message.content);
          if (success) {
            sent++;
            logger.info('发送跟进消息成功', {
              sessionId: task.sessionId,
              reason: task.reason
            });
          } else {
            failed++;
          }
        }
      }

      return {
        total: tasks.length,
        sent,
        failed
      };
    } catch (error: unknown) {
      logger.error('执行跟进任务失败', { error });
      return {
        total: 0,
        sent: 0,
        failed: 0
      };
    }
  }
}

export const proactiveFollowUpService = new ProactiveFollowUpService();
