import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import { MentorStage, mentorStageService } from './mentorStageService';
import { mentorPromptBuilder, PromptContext } from './mentorPromptBuilder';
import { aiServiceClient } from './aiServiceClient';

/**
 * AI导师触发服务
 * 负责在任务流程的关键节点自动触发导师对话
 */

export enum TriggerType {
  TASK_ACCEPTED = 'task_accepted',
  EXECUTION_STARTED = 'execution_started',
  STUDENT_STUCK = 'student_stuck',
  SUBMISSION_READY = 'submission_ready',
  COMPANY_FEEDBACK = 'company_feedback',
  MANUAL = 'manual',
}

export interface TriggerCondition {
  type: TriggerType;
  taskId: string;
  studentId: string;
  metadata?: any;
}

export class MentorTriggerService {
  /**
   * 触发需求理解阶段（任务接单后24小时内）
   */
  async triggerRequirementUnderstanding(taskId: string, studentId: string): Promise<void> {
    try {
      logger.info('触发需求理解阶段', { taskId, studentId });

      // 创建会话
      const sessionId = await mentorStageService.createSession(taskId, studentId);

      // 记录触发事件
      await this.recordTrigger(sessionId, TriggerType.TASK_ACCEPTED, {
        taskId,
        studentId,
      });

      // 获取任务和用户信息
      const context = await this.buildContext(taskId, studentId);

      // 构建Prompt
      const prompt = await mentorPromptBuilder.buildPrompt(
        MentorStage.REQUIREMENT_UNDERSTANDING,
        context
      );

      // 调用AI生成开场白
      const startTime = Date.now();
      const response = await aiServiceClient.chat({
        model: this.mapModelRecommendation(prompt.modelRecommendation),
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt },
        ],
        max_tokens: prompt.maxTokens,
        temperature: prompt.temperature,
      });

      const responseTime = Date.now() - startTime;

      // 保存导师消息
      await mentorStageService.saveMessage(sessionId, 'mentor', response.content, {
        stage: MentorStage.REQUIREMENT_UNDERSTANDING,
        modelUsed: response.model,
        tokensUsed: response.usage.total_tokens,
        cost: this.calculateCost(response.model, response.usage.total_tokens),
        responseTimeMs: responseTime,
      });

      // 保存系统消息（触发说明）
      await mentorStageService.saveMessage(
        sessionId,
        'system',
        '任务接单成功，启动需求理解阶段',
        { stage: MentorStage.REQUIREMENT_UNDERSTANDING }
      );

      logger.info('需求理解阶段触发成功', { taskId, studentId, sessionId });
    } catch (error) {
      logger.error('触发需求理解阶段失败', { error, taskId, studentId });
      throw error;
    }
  }

  /**
   * 触发执行引导阶段（学生开始执行后）
   */
  async triggerExecutionGuidance(taskId: string, studentId: string, studentQuestion?: string): Promise<void> {
    try {
      logger.info('触发执行引导阶段', { taskId, studentId });

      // 获取或创建会话
      let session = await mentorStageService.getSessionByTaskId(taskId);
      if (!session) {
        const sessionId = await mentorStageService.createSession(taskId, studentId);
        session = await mentorStageService.getSession(sessionId);
      }

      if (!session) {
        throw new Error('无法创建会话');
      }

      // 转换到执行引导阶段
      await mentorStageService.transitionStage(session.id, MentorStage.EXECUTION_GUIDANCE);

      // 记录触发事件
      await this.recordTrigger(session.id, TriggerType.EXECUTION_STARTED, {
        taskId,
        studentId,
        studentQuestion,
      });

      // 获取上下文
      const context = await this.buildContext(taskId, studentId, {
        studentQuestion: studentQuestion || '我准备开始执行任务了',
      });

      // 获取会话历史
      const messages = await mentorStageService.getMessages(session.id, 10);
      context.conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // 构建Prompt
      const prompt = await mentorPromptBuilder.buildPrompt(
        MentorStage.EXECUTION_GUIDANCE,
        context
      );

      // 调用AI
      const startTime = Date.now();
      const response = await aiServiceClient.chat({
        model: this.mapModelRecommendation(prompt.modelRecommendation),
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt },
        ],
        max_tokens: prompt.maxTokens,
        temperature: prompt.temperature,
      });

      const responseTime = Date.now() - startTime;

      // 保存消息
      await mentorStageService.saveMessage(session.id, 'mentor', response.content, {
        stage: MentorStage.EXECUTION_GUIDANCE,
        modelUsed: response.model,
        tokensUsed: response.usage.total_tokens,
        cost: this.calculateCost(response.model, response.usage.total_tokens),
        responseTimeMs: responseTime,
      });

      // 更新统计
      await mentorStageService.incrementStats(session.id, 'guidanceCount');

      logger.info('执行引导阶段触发成功', { taskId, studentId, sessionId: session.id });
    } catch (error) {
      logger.error('触发执行引导阶段失败', { error, taskId, studentId });
      throw error;
    }
  }

  /**
   * 触发质量预审阶段（学生准备提交前）
   */
  async triggerQualityReview(taskId: string, studentId: string, submission: string): Promise<{
    passed: boolean;
    score: number;
    feedback: string;
  }> {
    try {
      logger.info('触发质量预审阶段', { taskId, studentId });

      // 获取会话
      let session = await mentorStageService.getSessionByTaskId(taskId);
      if (!session) {
        const sessionId = await mentorStageService.createSession(taskId, studentId);
        session = await mentorStageService.getSession(sessionId);
      }

      if (!session) {
        throw new Error('无法创建会话');
      }

      // 转换到质量预审阶段
      await mentorStageService.transitionStage(session.id, MentorStage.QUALITY_REVIEW);

      // 记录触发事件
      await this.recordTrigger(session.id, TriggerType.SUBMISSION_READY, {
        taskId,
        studentId,
        submissionLength: submission.length,
      });

      // 获取上下文
      const context = await this.buildContext(taskId, studentId, {
        submission,
      });

      // 构建Prompt
      const prompt = await mentorPromptBuilder.buildPrompt(
        MentorStage.QUALITY_REVIEW,
        context
      );

      // 调用AI（使用Opus进行质量审核）
      const startTime = Date.now();
      const response = await aiServiceClient.chat({
        model: 'claude-opus-4-7',
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.5,
      });

      const responseTime = Date.now() - startTime;

      // 解析评分（从AI回复中提取）
      const scoreMatch = response.content.match(/总体评分[：:]\s*(\d+)\/100/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      const passed = score >= 70;

      // 保存消息
      await mentorStageService.saveMessage(session.id, 'mentor', response.content, {
        stage: MentorStage.QUALITY_REVIEW,
        modelUsed: response.model,
        tokensUsed: response.usage.total_tokens,
        cost: this.calculateCost(response.model, response.usage.total_tokens),
        responseTimeMs: responseTime,
        extra: { score, passed },
      });

      // 更新会话
      await mentorStageService.updateSession(session.id, {
        preReviewPassed: passed,
        finalReviewScore: score,
      });

      await mentorStageService.incrementStats(session.id, 'preReviewCount');

      logger.info('质量预审完成', { taskId, studentId, score, passed });

      return {
        passed,
        score,
        feedback: response.content,
      };
    } catch (error) {
      logger.error('触发质量预审阶段失败', { error, taskId, studentId });
      throw error;
    }
  }

  /**
   * 触发沟通桥梁阶段（企业反馈后）
   */
  async triggerCommunicationBridge(
    taskId: string,
    studentId: string,
    companyFeedback: string
  ): Promise<void> {
    try {
      logger.info('触发沟通桥梁阶段', { taskId, studentId });

      // 获取会话
      let session = await mentorStageService.getSessionByTaskId(taskId);
      if (!session) {
        const sessionId = await mentorStageService.createSession(taskId, studentId);
        session = await mentorStageService.getSession(sessionId);
      }

      if (!session) {
        throw new Error('无法创建会话');
      }

      // 转换到沟通桥梁阶段
      await mentorStageService.transitionStage(session.id, MentorStage.COMMUNICATION_BRIDGE);

      // 记录触发事件
      await this.recordTrigger(session.id, TriggerType.COMPANY_FEEDBACK, {
        taskId,
        studentId,
        feedbackLength: companyFeedback.length,
      });

      // 获取上下文
      const context = await this.buildContext(taskId, studentId, {
        companyFeedback,
      });

      // 获取会话历史
      const messages = await mentorStageService.getMessages(session.id, 10);
      context.conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // 构建Prompt
      const prompt = await mentorPromptBuilder.buildPrompt(
        MentorStage.COMMUNICATION_BRIDGE,
        context
      );

      // 调用AI
      const startTime = Date.now();
      const response = await aiServiceClient.chat({
        model: this.mapModelRecommendation(prompt.modelRecommendation),
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt },
        ],
        max_tokens: prompt.maxTokens,
        temperature: prompt.temperature,
      });

      const responseTime = Date.now() - startTime;

      // 保存消息
      await mentorStageService.saveMessage(session.id, 'mentor', response.content, {
        stage: MentorStage.COMMUNICATION_BRIDGE,
        modelUsed: response.model,
        tokensUsed: response.usage.total_tokens,
        cost: this.calculateCost(response.model, response.usage.total_tokens),
        responseTimeMs: responseTime,
      });

      // 更新统计
      await mentorStageService.incrementStats(session.id, 'translationCount');

      logger.info('沟通桥梁阶段触发成功', { taskId, studentId, sessionId: session.id });
    } catch (error) {
      logger.error('触发沟通桥梁阶段失败', { error, taskId, studentId });
      throw error;
    }
  }

  /**
   * 记录触发事件
   */
  private async recordTrigger(
    sessionId: string,
    triggerType: TriggerType,
    metadata: any
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO mentor_stage_triggers
         (session_id, trigger_type, trigger_condition, fired_at)
         VALUES ($1, $2, $3, NOW())`,
        [sessionId, triggerType, JSON.stringify(metadata)]
      );
    } catch (error) {
      logger.error('记录触发事件失败', { error, sessionId, triggerType });
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 构建上下文
   */
  private async buildContext(
    taskId: string,
    studentId: string,
    stageSpecificData?: any
  ): Promise<PromptContext> {
    try {
      // 获取任务信息
      const task = await queryOne<any>(
        `SELECT t.*, c.company_name, c.industry
         FROM tasks t
         LEFT JOIN companies c ON t.company_id = c.id
         WHERE t.id = $1`,
        [taskId]
      );

      if (!task) {
        throw new Error('任务不存在');
      }

      // 获取学生信息
      const student = await queryOne<any>(
        `SELECT nickname, university, major FROM students WHERE id = $1`,
        [studentId]
      );

      return {
        taskTitle: task.title,
        taskDescription: task.description,
        taskRequirements: task.requirements,
        taskDeadline: task.deadline,
        studentName: student?.nickname || '同学',
        studentLevel: student?.university || undefined,
        studentMajor: student?.major || undefined,
        companyName: task.company_name || '企业',
        companyIndustry: task.industry || undefined,
        stageSpecificData,
      };
    } catch (error) {
      logger.error('构建上下文失败', { error, taskId, studentId });
      throw error;
    }
  }

  /**
   * 映射模型推荐
   */
  private mapModelRecommendation(recommendation: 'opus' | 'sonnet' | 'haiku'): string {
    switch (recommendation) {
      case 'opus':
        return 'claude-opus-4-7';
      case 'sonnet':
        return 'claude-sonnet-4-6';
      case 'haiku':
        return 'claude-haiku-4-5';
      default:
        return 'claude-sonnet-4-6';
    }
  }

  /**
   * 计算成本（简化版）
   */
  private calculateCost(model: string, tokens: number): number {
    // 价格（美元/百万tokens）
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-opus-4-7': { input: 15, output: 75 },
      'claude-sonnet-4-6': { input: 3, output: 15 },
      'claude-haiku-4-5': { input: 0.8, output: 4 },
    };

    const modelPricing = pricing[model] || pricing['claude-sonnet-4-6'];
    // 简化计算：假设input和output各占一半
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;
    return (tokens / 1000000) * avgPrice;
  }
}

export const mentorTriggerService = new MentorTriggerService();
