import { query, queryOne } from '../utils/db';
import logger from '../utils/logger';
import anthropic from '../config/anthropic';
import aiLogService from './aiLogService';

/**
 * 跳级服务
 * 处理跳级申请、测试任务推送、审核
 */

interface JumpEligibility {
  eligible: boolean;
  currentLevel: number;
  targetLevel: number;
  reasons: string[];
  missingConditions: string[];
}

interface JumpTestTask {
  title: string;
  description: string;
  requirements: string;
  acceptanceCriteria: string;
  difficulty: number;
  estimatedHours: number;
}

class JumpTestService {
  /**
   * 检查学生是否满足跳级条件
   */
  async checkJumpEligibility(studentId: string): Promise<JumpEligibility> {
    try {
      // 获取学生信息
      const student = await queryOne<{
        current_level: number;
        track: string;
        jump_cooling_orders_needed: number;
      }>(
        `SELECT current_level, track, jump_cooling_orders_needed FROM users WHERE id = $1`,
        [studentId]
      );

      if (!student) {
        throw new Error('Student not found');
      }

      const currentLevel = student.current_level;
      const targetLevel = currentLevel + 2; // 跳两级

      if (currentLevel >= 4) {
        return {
          eligible: false,
          currentLevel,
          targetLevel: currentLevel,
          reasons: [],
          missingConditions: ['已达到Lv.4或以上，无法继续跳级'],
        };
      }

      // 检查冷却期
      if (student.jump_cooling_orders_needed > 0) {
        return {
          eligible: false,
          currentLevel,
          targetLevel,
          reasons: [],
          missingConditions: [`还需完成${student.jump_cooling_orders_needed}个订单才能再次申请跳级`],
        };
      }

      // 获取当前等级配置
      const levelConfig = await queryOne<{
        required_orders: number;
        min_rating: number;
      }>(
        `SELECT required_orders, min_rating FROM level_configs WHERE level = $1 AND track = $2`,
        [currentLevel, student.track]
      );

      if (!levelConfig) {
        throw new Error('Level config not found');
      }

      // 检查订单完成数和评分
      const orderStats = await queryOne<{
        total_orders: number;
        avg_rating: number;
      }>(
        `SELECT
          COUNT(*) as total_orders,
          AVG(company_score) as avg_rating
         FROM orders
         WHERE student_id = $1 AND status = 'completed' AND order_type = 'normal'`,
        [studentId]
      );

      const totalOrders = orderStats?.total_orders || 0;
      const avgRating = orderStats?.avg_rating || 0;

      const missingConditions: string[] = [];
      const reasons: string[] = [];

      // 条件1：完成订单数 >= 当前等级要求的2倍
      const requiredOrders = levelConfig.required_orders * 2;
      if (totalOrders < requiredOrders) {
        missingConditions.push(`需要完成${requiredOrders}个订单，当前完成${totalOrders}个`);
      } else {
        reasons.push(`已完成${totalOrders}个订单（超过要求的${requiredOrders}个）`);
      }

      // 条件2：平均评分 >= 85
      if (avgRating < 85) {
        missingConditions.push(`平均评分需要≥85分，当前${avgRating.toFixed(1)}分`);
      } else {
        reasons.push(`平均评分${avgRating.toFixed(1)}分（超过要求的85分）`);
      }

      const eligible = missingConditions.length === 0;

      return {
        eligible,
        currentLevel,
        targetLevel,
        reasons,
        missingConditions,
      };
    } catch (error) {
      logger.error('Failed to check jump eligibility:', error);
      throw error;
    }
  }

  /**
   * 申请跳级
   */
  async applyForJumpTest(studentId: string): Promise<{
    success: boolean;
    jumpRecordId: string;
    testTask: JumpTestTask;
  }> {
    try {
      // 检查资格
      const eligibility = await this.checkJumpEligibility(studentId);

      if (!eligibility.eligible) {
        throw new Error(`不满足跳级条件: ${eligibility.missingConditions.join(', ')}`);
      }

      // 获取学生信息
      const student = await queryOne<{
        track: string;
      }>(
        `SELECT track FROM users WHERE id = $1`,
        [studentId]
      );

      if (!student) {
        throw new Error('Student not found');
      }

      // 获取跳级测试模板
      const template = await this.getJumpTestTemplate(student.track, eligibility.targetLevel);

      // 创建跳级记录
      const jumpRecord = await queryOne<{ id: string }>(
        `INSERT INTO jump_test_records (
          student_id, from_level, target_level, track, status
        ) VALUES ($1, $2, $3, $4, 'pending')
        RETURNING id`,
        [studentId, eligibility.currentLevel, eligibility.targetLevel, student.track]
      );

      if (!jumpRecord) {
        throw new Error('Failed to create jump record');
      }

      logger.info(`Jump test applied: student ${studentId}, from Lv.${eligibility.currentLevel} to Lv.${eligibility.targetLevel}`);

      return {
        success: true,
        jumpRecordId: jumpRecord.id,
        testTask: template,
      };
    } catch (error) {
      logger.error('Failed to apply for jump test:', error);
      throw error;
    }
  }

  /**
   * 获取跳级测试模板
   */
  private async getJumpTestTemplate(track: string, targetLevel: number): Promise<JumpTestTask> {
    try {
      // 从模板表获取
      const template = await queryOne<{
        title: string;
        description: string;
        requirements: string;
        acceptance_criteria: string;
        difficulty: number;
        estimated_hours: number;
      }>(
        `SELECT title, description, requirements, acceptance_criteria, difficulty, estimated_hours
         FROM jump_test_templates
         WHERE track = $1 AND target_level = $2 AND is_active = true`,
        [track, targetLevel]
      );

      if (template) {
        return {
          title: template.title,
          description: template.description,
          requirements: template.requirements,
          acceptanceCriteria: template.acceptance_criteria,
          difficulty: template.difficulty,
          estimatedHours: template.estimated_hours,
        };
      }

      // 如果没有模板，使用AI生成
      logger.info(`No template found for ${track} Lv.${targetLevel}, generating with AI`);
      return await this.generateJumpTestTaskWithAI(track, targetLevel);
    } catch (error) {
      logger.error('Failed to get jump test template:', error);
      throw error;
    }
  }

  /**
   * 使用AI生成跳级测试任务
   */
  private async generateJumpTestTaskWithAI(track: string, targetLevel: number): Promise<JumpTestTask> {
    const trackName = track === 'content' ? 'AI内容创作' : 'AI工具开发';

    const prompt = `你是启程平台的任务设计专家。请为${trackName}赛道的Lv.${targetLevel}跳级测试设计一个任务。

## 要求
1. 任务难度应该对标Lv.${targetLevel}的标准难度
2. 任务应该能在24-48小时内完成
3. 任务应该能全面考察学生的能力
4. 任务应该有明确的交付标准

## 输出格式（JSON）
{
  "title": "任务标题",
  "description": "任务背景和目标",
  "requirements": "具体要求（分点列出）",
  "acceptanceCriteria": "验收标准（分点列出）",
  "difficulty": ${targetLevel},
  "estimatedHours": 24
}

请直接输出JSON，不要其他内容。`;

    const startTime = Date.now();

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const duration = Date.now() - startTime;
      const content = response.content[0];

      // 记录AI调用
      await aiLogService.logAICall({
        engineName: 'AI-07-JumpTest',
        modelName: 'claude-3-5-sonnet-20241022',
        userId: 'system',
        userType: 'system',
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        costYuan: aiLogService.calculateClaudeCost(
          'claude-3-5-sonnet-20241022',
          response.usage.input_tokens,
          response.usage.output_tokens
        ),
        durationMs: duration,
        status: 'success',
      });

      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const taskData = JSON.parse(jsonMatch[0]);
          return taskData;
        }
      }

      throw new Error('Failed to parse AI response');
    } catch (error) {
      logger.error('Failed to generate jump test task with AI:', error);

      // 降级：返回通用模板
      return {
        title: `${trackName} Lv.${targetLevel} 跳级测试`,
        description: `这是一个Lv.${targetLevel}难度的跳级测试任务，请展示你的综合能力。`,
        requirements: '1. 独立完成任务\n2. 提交完整的交付物\n3. 提供详细的制作说明',
        acceptanceCriteria: '1. 交付物完整\n2. 质量达到Lv.${targetLevel}标准\n3. 制作流程清晰',
        difficulty: targetLevel,
        estimatedHours: 24,
      };
    }
  }

  /**
   * 推送跳级测试任务
   */
  async pushJumpTestTask(studentId: string, jumpRecordId: string, testTask: JumpTestTask): Promise<string> {
    try {
      // 创建测试订单
      const order = await queryOne<{ id: string }>(
        `INSERT INTO orders (
          student_id, task_id, order_type, status,
          income_amount, deadline_at
        ) VALUES ($1, NULL, 'jump_test', 'in_progress', 0, NOW() + INTERVAL '48 hours')
        RETURNING id`,
        [studentId]
      );

      if (!order) {
        throw new Error('Failed to create jump test order');
      }

      // 更新跳级记录
      await query(
        `UPDATE jump_test_records
         SET test_order_id = $1, status = 'testing'
         WHERE id = $2`,
        [order.id, jumpRecordId]
      );

      // 发送导师T-01消息
      const student = await queryOne<{
        current_level: number;
        track: string;
      }>(
        `SELECT current_level, track FROM users WHERE id = $1`,
        [studentId]
      );

      if (student) {
        const targetLevel = student.current_level + 2;
        const mentorMessage = `你申请了从Lv.${student.current_level}跳级到Lv.${targetLevel}。这是你的跳级测试任务：

**${testTask.title}**

${testTask.description}

**具体要求：**
${testTask.requirements}

**验收标准：**
${testTask.acceptanceCriteria}

**时间限制：** 48小时

⚠️ 注意：
- 这次我不会给你额外引导——你需要独立完成
- 提交后AI会以更高标准审核（85分）
- 不允许打回修改，一次提交定结果
- 如果失败，需要再完成2个当前等级订单才能再次申请

准备好了就开始吧。`;

        await query(
          `INSERT INTO mentor_sessions (order_id, student_id, scenario, message, created_at)
           VALUES ($1, $2, 'T01-JumpTest', $3, NOW())`,
          [order.id, studentId, mentorMessage]
        );
      }

      logger.info(`Jump test task pushed: order ${order.id}, student ${studentId}`);

      return order.id;
    } catch (error) {
      logger.error('Failed to push jump test task:', error);
      throw error;
    }
  }

  /**
   * 审核跳级测试（AI-03跳级模式）
   */
  async reviewJumpTest(orderId: string, submissionContent: string, fileUrls: string[]): Promise<{
    passed: boolean;
    score: number;
    feedback: string;
  }> {
    try {
      // 获取订单和跳级记录
      const order = await queryOne<{
        student_id: string;
      }>(
        `SELECT student_id FROM orders WHERE id = $1 AND order_type = 'jump_test'`,
        [orderId]
      );

      if (!order) {
        throw new Error('Jump test order not found');
      }

      const jumpRecord = await queryOne<{
        id: string;
        from_level: number;
        target_level: number;
        track: string;
      }>(
        `SELECT id, from_level, target_level, track
         FROM jump_test_records
         WHERE test_order_id = $1 AND status = 'testing'`,
        [orderId]
      );

      if (!jumpRecord) {
        throw new Error('Jump test record not found');
      }

      // 获取测试任务模板
      const template = await this.getJumpTestTemplate(jumpRecord.track, jumpRecord.target_level);

      // 调用AI审核（跳级模式）
      const aiReview = await this.aiReviewJumpTest(
        template,
        submissionContent,
        fileUrls,
        jumpRecord.target_level
      );

      const passed = aiReview.score >= 85;

      // 更新跳级记录
      await query(
        `UPDATE jump_test_records
         SET status = $1, ai_score = $2, ai_feedback = $3, submitted_at = NOW(), reviewed_at = NOW()
         WHERE id = $4`,
        [passed ? 'passed' : 'failed', aiReview.score, aiReview.feedback, jumpRecord.id]
      );

      if (passed) {
        // 通过：升级
        await this.upgradeStudent(order.student_id, jumpRecord.target_level);

        // 发送T-05见证消息
        const mentorMessage = `🎉 你做到了！

从Lv.${jumpRecord.from_level}直接跳到Lv.${jumpRecord.target_level}。这个测试任务证明了你不需要按部就班。

**AI审核评分：** ${aiReview.score}分

${aiReview.feedback}

现在你可以：
- 接更难的项目
${jumpRecord.target_level >= 5 ? '- 创建队伍\n- 在社区发布招募' : ''}

继续保持这个势头！`;

        await query(
          `INSERT INTO mentor_sessions (order_id, student_id, scenario, message, created_at)
           VALUES ($1, $2, 'T05-JumpSuccess', $3, NOW())`,
          [orderId, order.student_id, mentorMessage]
        );
      } else {
        // 失败：设置冷却期
        await query(
          `UPDATE users SET jump_cooling_orders_needed = 2 WHERE id = $1`,
          [order.student_id]
        );

        // 发送导师消息
        const mentorMessage = `这次跳级测试没有通过。

**AI审核评分：** ${aiReview.score}分（需要≥85分）

${aiReview.feedback}

不是能力不够，可能是准备还差一点。完成当前等级的2个新任务后，你可以再次申请。到时候我会帮你回顾这次的经验。`;

        await query(
          `INSERT INTO mentor_sessions (order_id, student_id, scenario, message, created_at)
           VALUES ($1, $2, 'T05-JumpFailed', $3, NOW())`,
          [orderId, order.student_id, mentorMessage]
        );
      }

      logger.info(`Jump test reviewed: order ${orderId}, passed: ${passed}, score: ${aiReview.score}`);

      return {
        passed,
        score: aiReview.score,
        feedback: aiReview.feedback,
      };
    } catch (error) {
      logger.error('Failed to review jump test:', error);
      throw error;
    }
  }

  /**
   * AI审核跳级测试（更严格的标准）
   */
  private async aiReviewJumpTest(
    template: JumpTestTask,
    submissionContent: string,
    fileUrls: string[],
    targetLevel: number
  ): Promise<{ score: number; feedback: string }> {
    const prompt = `你是启程平台的跳级测试审核专家。请以更严格的标准审核这份跳级测试提交。

## 测试任务
**标题：** ${template.title}
**要求：** ${template.requirements}
**验收标准：** ${template.acceptanceCriteria}
**目标等级：** Lv.${targetLevel}

## 学生提交
${submissionContent}

${fileUrls.length > 0 ? `**附件：** ${fileUrls.join(', ')}` : ''}

## 审核要求
1. **评分阈值：** 85分（普通任务为70分）
2. **交付完整度：** 缺失必选项直接判定不通过
3. **质量标准：** 必须达到Lv.${targetLevel}的标准
4. **不提供修改建议：** 因为跳级测试不允许修改重交

## 输出格式（JSON）
{
  "score": 85,
  "feedback": "详细的审核意见"
}

请直接输出JSON。`;

    const startTime = Date.now();

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      const duration = Date.now() - startTime;
      const content = response.content[0];

      // 记录AI调用
      await aiLogService.logAICall({
        engineName: 'AI-03-JumpReview',
        modelName: 'claude-3-5-sonnet-20241022',
        userId: 'system',
        userType: 'system',
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        costYuan: aiLogService.calculateClaudeCost(
          'claude-3-5-sonnet-20241022',
          response.usage.input_tokens,
          response.usage.output_tokens
        ),
        durationMs: duration,
        status: 'success',
      });

      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const reviewData = JSON.parse(jsonMatch[0]);
          return {
            score: reviewData.score,
            feedback: reviewData.feedback,
          };
        }
      }

      throw new Error('Failed to parse AI review response');
    } catch (error) {
      logger.error('Failed to AI review jump test:', error);

      // 降级：返回保守评分
      return {
        score: 70,
        feedback: 'AI审核暂时不可用，建议重新提交。',
      };
    }
  }

  /**
   * 升级学生等级
   */
  private async upgradeStudent(studentId: string, newLevel: number): Promise<void> {
    await query(
      `UPDATE users
       SET current_level = $1,
           jump_success_count = jump_success_count + 1,
           jump_cooling_orders_needed = 0,
           updated_at = NOW()
       WHERE id = $2`,
      [newLevel, studentId]
    );

    logger.info(`Student ${studentId} upgraded to Lv.${newLevel}`);
  }

  /**
   * 订单完成后减少冷却期计数
   */
  async decreaseCoolingOrders(studentId: string): Promise<void> {
    await query(
      `UPDATE users
       SET jump_cooling_orders_needed = GREATEST(0, jump_cooling_orders_needed - 1)
       WHERE id = $1 AND jump_cooling_orders_needed > 0`,
      [studentId]
    );
  }
}

export default new JumpTestService();
