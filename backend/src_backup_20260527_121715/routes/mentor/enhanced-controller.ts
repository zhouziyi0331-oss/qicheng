// 启程小猫 - 完整AI导师系统
// 实现需求理解、执行引导、质量审核、沟通桥梁四大核心功能

import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ══════════════════════════════════════════════════════════════
// 阶段1：需求理解与确认
// ══════════════════════════════════════════════════════════════

/**
 * 任务匹配后，AI导师主动发起需求确认对话
 */
export async function initiateRequirementConfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const studentId = req.user!.userId;

    // 获取任务详情
    const task = await queryOne<{
      id: string;
      title: string;
      description: string;
      requirements: any;
      acceptance_criteria: string;
      company_id: string;
    }>('SELECT * FROM tasks WHERE id = $1', [taskId]);

    if (!task) {
      throw new AppError('任务不存在', 404);
    }

    // 获取企业方的原始需求描述
    const companyRequirement = await queryOne<{
      original_description: string;
      expected_deliverables: any;
    }>('SELECT original_description, expected_deliverables FROM task_requirements WHERE task_id = $1', [taskId]);

    // 构建AI Prompt - 启发式提问
    const prompt = `你是启程小猫，一个温暖、启发式的AI导师。学生刚被匹配到一个任务，你需要确认他是否真正理解了企业的需求。

## 企业方需求
标题：${task.title}
描述：${task.description}
验收标准：${task.acceptance_criteria}
${companyRequirement ? `详细需求：${companyRequirement.original_description}` : ''}

## 你的任务
用启发式提问的方式，让学生用自己的话复述这个需求。不要直接告诉答案，而是：
1. 先问学生看完需求后的第一感觉
2. 让学生用自己的话说说要做什么
3. 问学生觉得最关键的是哪几点
4. 问学生有没有不确定的地方

## 语气要求
- 温暖、好奇、像朋友聊天
- 用简单的口语，不要专业术语
- 可以用emoji，但不要过度
- 每次只问1-2个问题，不要一次问太多

请生成第一条消息（100字以内）：`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const mentorResponse = message.content[0].type === 'text' ? message.content[0].text : '';

    // 保存对话记录
    await query(
      `INSERT INTO mentor_conversations 
       (student_id, task_id, stage, trigger_type, mentor_response, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [studentId, taskId, 'requirement_confirmation', 'task_matched', mentorResponse]
    );

    // 创建需求确认会话
    await query(
      `INSERT INTO requirement_confirmation_sessions 
       (task_id, student_id, status, started_at)
       VALUES ($1, $2, $3, NOW())`,
      [taskId, studentId, 'in_progress']
    );

    res.json({
      success: true,
      data: {
        message: mentorResponse,
        sessionId: taskId,
        stage: 'requirement_confirmation'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 分析学生对需求的理解是否准确
 */
export async function analyzeStudentUnderstanding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const { studentResponse } = req.body;
    const studentId = req.user!.userId;

    // 获取任务详情和企业需求
    const task = await queryOne<any>('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const companyRequirement = await queryOne<any>(
      'SELECT * FROM task_requirements WHERE task_id = $1',
      [taskId]
    );

    // 获取对话历史
    const conversationHistory = await query<any>(
      `SELECT mentor_response, student_message FROM mentor_conversations 
       WHERE task_id = $1 AND student_id = $2 
       ORDER BY created_at ASC`,
      [taskId, studentId]
    );

    // 构建AI Prompt - 分析理解准确度
    const analysisPrompt = `你是启程小猫，需要分析学生对任务需求的理解是否准确。

## 企业方真实需求
${task.description}
验收标准：${task.acceptance_criteria}
${companyRequirement ? `详细说明：${companyRequirement.original_description}` : ''}

## 学生的理解
${studentResponse}

## 对话历史
${conversationHistory.map((c: any) => `导师：${c.mentor_response}\n学生：${c.student_message || ''}`).join('\n')}

## 你的任务
1. 判断学生的理解是否准确（准确度0-100分）
2. 找出理解偏差的地方
3. 如果有偏差，用启发式提问引导纠正（不要直接说答案）
4. 如果理解准确，给予肯定并生成产品功能框架

## 返回JSON格式
{
  "accuracy": 85,
  "misunderstandings": ["偏差点1", "偏差点2"],
  "isAccurate": true/false,
  "nextMessage": "给学生的下一条消息",
  "productFramework": "如果理解准确，生成简单的功能框架"
}

请返回JSON：`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const analysisText = message.content[0].type === 'text' ? message.content[0].text : '';
    const analysis = JSON.parse(analysisText.replace(/```json\n?|\n?```/g, ''));

    // 保存学生回复和分析结果
    await query(
      `UPDATE mentor_conversations 
       SET student_message = $1, analysis_result = $2, accuracy_score = $3
       WHERE task_id = $4 AND student_id = $5 AND student_message IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [studentResponse, analysis, analysis.accuracy, taskId, studentId]
    );

    // 如果理解准确，更新会话状态并生成PRD
    if (analysis.isAccurate) {
      await query(
        `UPDATE requirement_confirmation_sessions 
         SET status = $1, accuracy_score = $2, product_framework = $3, completed_at = NOW()
         WHERE task_id = $4 AND student_id = $5`,
        ['confirmed', analysis.accuracy, analysis.productFramework, taskId, studentId]
      );
    }

    // 保存下一条消息
    await query(
      `INSERT INTO mentor_conversations 
       (student_id, task_id, stage, trigger_type, mentor_response, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [studentId, taskId, 'requirement_confirmation', 'student_response', analysis.nextMessage]
    );

    res.json({
      success: true,
      data: {
        accuracy: analysis.accuracy,
        isAccurate: analysis.isAccurate,
        message: analysis.nextMessage,
        productFramework: analysis.productFramework,
        misunderstandings: analysis.misunderstandings
      }
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════
// 阶段2：执行引导（启发式教学）
// ══════════════════════════════════════════════════════════════

/**
 * 学生求助时的启发式引导
 */
export async function provideInspirationalGuidance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const { question, currentStep, context } = req.body;
    const studentId = req.user!.userId;

    // 获取学生信息和历史
    const student = await queryOne<any>(
      'SELECT * FROM student_profiles WHERE user_id = $1',
      [studentId]
    );

    const taskProgress = await queryOne<any>(
      'SELECT * FROM task_progress WHERE task_id = $1 AND student_id = $2',
      [taskId, studentId]
    );

    // 获取最近的对话历史
    const recentConversations = await query<any>(
      `SELECT * FROM mentor_conversations 
       WHERE task_id = $1 AND student_id = $2 
       ORDER BY created_at DESC LIMIT 5`,
      [taskId, studentId]
    );

    // 构建启发式引导Prompt
    const guidancePrompt = `你是启程小猫，一个启发式教育的AI导师。学生遇到了问题，你要引导他自己思考，而不是直接给答案。

## 学生信息
- OPC标签：${student?.opc_label}
- 等级：Lv.${student?.level}
- 当前进度：${currentStep}
- 已完成任务数：${student?.task_count}

## 学生的问题
${question}

## 当前上下文
${context || '无'}

## 最近对话
${recentConversations.map((c: any) => `学生：${c.student_message}\n导师：${c.mentor_response}`).join('\n')}

## 你的任务（启发式引导原则）
1. **不要直接给答案**，而是：
   - 问学生"你觉得可以试试什么方法？"
   - 引导学生回忆之前学过的类似情况
   - 提示关键词让学生自己搜索
   
2. **推荐工具和方法**：
   - 根据学生的水平推荐合适的工具
   - 给出搜索关键词，不要给具体步骤
   
3. **给予鼓励**：
   - 肯定学生提问的勇气
   - 指出学生比之前进步的地方
   - 用具体的例子鼓励

4. **分步引导**：
   - 把大问题拆成小问题
   - 每次只引导一小步
   - 让学生自己走完整个思考过程

## 语气要求
- 温暖、耐心、好奇
- 像朋友聊天，不要说教
- 用简单的口语
- 可以用emoji

请生成引导消息（150字以内）：`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: guidancePrompt }],
    });

    const guidanceResponse = message.content[0].type === 'text' ? message.content[0].text : '';

    // 保存对话
    await query(
      `INSERT INTO mentor_conversations 
       (student_id, task_id, stage, trigger_type, student_message, mentor_response, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [studentId, taskId, 'execution_guidance', 'student_question', question, guidanceResponse]
    );

    // 记录学生求助次数（用于后续分析）
    await query(
      `UPDATE task_progress 
       SET help_requests = COALESCE(help_requests, 0) + 1
       WHERE task_id = $1 AND student_id = $2`,
      [taskId, studentId]
    );

    res.json({
      success: true,
      data: {
        message: guidanceResponse,
        encouragement: true
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 学生完成一个步骤后的鼓励和下一步引导
 */
export async function celebrateProgressAndGuideNext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const { completedStep, achievement } = req.body;
    const studentId = req.user!.userId;

    // 获取学生历史数据
    const student = await queryOne<any>(
      'SELECT * FROM student_profiles WHERE user_id = $1',
      [studentId]
    );

    const previousTasks = await query<any>(
      `SELECT * FROM task_completions 
       WHERE student_id = $1 
       ORDER BY completed_at DESC LIMIT 3`,
      [studentId]
    );

    // 构建鼓励Prompt
    const encouragementPrompt = `你是启程小猫，学生刚完成了一个步骤，你要给予具体的鼓励和引导。

## 学生信息
- 等级：Lv.${student?.level}
- 历史任务：${previousTasks.length}个

## 刚完成的步骤
${completedStep}

## 成果
${achievement}

## 你的任务
1. **具体的鼓励**：
   - 指出这次做得好的具体地方
   - 对比之前的进步（如果有历史数据）
   - 用具体的例子，不要泛泛而谈
   
2. **增强信心**：
   - "你看，你现在已经会XXX了"
   - "比上次快了很多"
   - "这个思路很棒"
   
3. **引导下一步**：
   - 简单提示下一步要做什么
   - 不要给具体步骤，让学生自己思考
   
## 语气要求
- 真诚、温暖、具体
- 像朋友一样为他高兴
- 不要夸张，要真实

请生成鼓励消息（100字以内）：`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: encouragementPrompt }],
    });

    const encouragement = message.content[0].type === 'text' ? message.content[0].text : '';

    // 保存鼓励消息
    await query(
      `INSERT INTO mentor_conversations 
       (student_id, task_id, stage, trigger_type, mentor_response, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [studentId, taskId, 'execution_guidance', 'step_completed', encouragement]
    );

    res.json({
      success: true,
      data: {
        message: encouragement
      }
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════
// 阶段3：质量审核（AI先审核再推送给企业）
// ══════════════════════════════════════════════════════════════

/**
 * 学生提交作品后，AI先审核
 */
export async function reviewSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const { deliverables, description, fileUrls } = req.body;
    const studentId = req.user!.userId;

    // 获取任务需求
    const task = await queryOne<any>('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const requirement = await queryOne<any>(
      'SELECT * FROM task_requirements WHERE task_id = $1',
      [taskId]
    );

    // 构建审核Prompt
    const reviewPrompt = `你是启程小猫，需要审核学生提交的作品是否符合企业需求。

## 企业需求
标题：${task.title}
描述：${task.description}
验收标准：${task.acceptance_criteria}
${requirement ? `详细要求：${requirement.original_description}` : ''}

## 学生提交
描述：${description}
文件：${fileUrls?.join(', ') || '无'}
交付物：${JSON.stringify(deliverables)}

## 你的任务
1. **检查是否符合需求**：
   - 每个验收标准是否都满足
   - 功能是否完整
   - 质量是否达标
   
2. **功能可用性测试**（基于描述判断）：
   - 逻辑是否合理
   - 是否有明显bug
   - 用户体验如何
   
3. **提出具体改进建议**：
   - 哪里需要改进
   - 为什么需要改进
   - 怎么改进（启发式引导）

## 返回JSON格式
{
  "passReview": true/false,
  "score": 85,
  "strengths": ["优点1", "优点2"],
  "issues": [
    {
      "type": "功能缺失/质量问题/逻辑错误",
      "description": "具体问题",
      "suggestion": "改进建议（启发式）"
    }
  ],
  "overallFeedback": "总体反馈",
  "nextSteps": "如果不通过，下一步该做什么"
}

请返回JSON：`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: reviewPrompt }],
    });

    const reviewText = message.content[0].type === 'text' ? message.content[0].text : '';
    const review = JSON.parse(reviewText.replace(/```json\n?|\n?```/g, ''));

    // 保存审核结果
    await query(
      `INSERT INTO ai_submission_reviews 
       (task_id, student_id, review_result, pass_review, score, issues, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [taskId, studentId, review, review.passReview, review.score, JSON.stringify(review.issues)]
    );

    // 如果通过审核，推送给企业
    if (review.passReview) {
      await query(
        `UPDATE task_submissions 
         SET status = $1, ai_review_passed = true, ai_review_score = $2
         WHERE task_id = $3 AND student_id = $4`,
        ['pending_company_review', review.score, taskId, studentId]
      );

      // 通知企业
      await query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          task.company_id,
          'submission_ready',
          '学生提交了作品',
          `${task.title} - AI审核已通过`,
          JSON.stringify({ taskId, studentId, score: review.score })
        ]
      );
    } else {
      // 不通过，返回给学生修改
      await query(
        `UPDATE task_submissions 
         SET status = $1, ai_review_passed = false, ai_review_score = $2
         WHERE task_id = $3 AND student_id = $4`,
        ['needs_revision', review.score, taskId, studentId]
      );
    }

    // 保存反馈消息
    await query(
      `INSERT INTO mentor_conversations 
       (student_id, task_id, stage, trigger_type, mentor_response, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [studentId, taskId, 'quality_review', 'submission_review', review.overallFeedback]
    );

    res.json({
      success: true,
      data: {
        passReview: review.passReview,
        score: review.score,
        feedback: review.overallFeedback,
        strengths: review.strengths,
        issues: review.issues,
        nextSteps: review.nextSteps
      }
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════
// 阶段4：沟通桥梁（翻译双方需求）
// ══════════════════════════════════════════════════════════════

/**
 * 企业提出修改意见，AI翻译给学生
 */
export async function translateCompanyFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const { companyFeedback, revisionRequests } = req.body;
    const studentId = req.user!.userId;

    // 获取学生信息
    const student = await queryOne<any>(
      'SELECT * FROM student_profiles WHERE user_id = $1',
      [studentId]
    );

    // 构建翻译Prompt
    const translationPrompt = `你是启程小猫，企业方提出了修改意见，你需要翻译成学生能理解的语言。

## 企业方反馈
${companyFeedback}

## 具体修改要求
${JSON.stringify(revisionRequests)}

## 学生信息
- 等级：Lv.${student?.level}
- OPC标签：${student?.opc_label}

## 你的任务
1. **翻译成学生能懂的话**：
   - 去掉专业术语
   - 用具体的例子说明
   - 分点列出要改的地方
   
2. **给予鼓励**：
   - 先肯定做得好的地方
   - 再说需要改进的
   - 强调这是正常的迭代过程
   
3. **引导下一步**：
   - 每个修改点给出思路
   - 不要直接给答案
   - 让学生自己思考怎么改

## 语气要求
- 温暖、支持、具体
- 让学生觉得"改一改就好了"
- 不要让学生觉得做得很差

请生成翻译后的消息（200字以内）：`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: translationPrompt }],
    });

    const translatedFeedback = message.content[0].type === 'text' ? message.content[0].text : '';

    // 保存翻译后的反馈
    await query(
      `INSERT INTO mentor_conversations 
       (student_id, task_id, stage, trigger_type, mentor_response, original_feedback, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [studentId, taskId, 'communication_bridge', 'company_feedback', translatedFeedback, companyFeedback]
    );

    res.json({
      success: true,
      data: {
        translatedFeedback,
        originalFeedback: companyFeedback
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 学生有疑问，AI翻译给企业
 */
export async function translateStudentQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId } = req.params;
    const { studentQuestion } = req.body;
    const studentId = req.user!.userId;

    // 获取任务信息
    const task = await queryOne<any>('SELECT * FROM tasks WHERE id = $1', [taskId]);

    // 构建翻译Prompt
    const translationPrompt = `你是启程小猫，学生对企业的反馈有疑问，你需要翻译成企业能理解的专业表达。

## 学生的疑问
${studentQuestion}

## 你的任务
1. **翻译成专业表达**：
   - 整理学生的口语表达
   - 用专业但不生硬的语言
   - 保留学生的核心意思
   
2. **补充上下文**：
   - 说明学生的困惑点
   - 解释学生的思路
   - 让企业更容易理解

请生成翻译后的消息（150字以内）：`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: translationPrompt }],
    });

    const translatedQuestion = message.content[0].type === 'text' ? message.content[0].text : '';

    // 保存翻译
    await query(
      `INSERT INTO mentor_conversations 
       (student_id, task_id, stage, trigger_type, student_message, mentor_response, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [studentId, taskId, 'communication_bridge', 'student_question_to_company', studentQuestion, translatedQuestion]
    );

    // 发送给企业
    await query(
      `INSERT INTO task_communications 
       (task_id, from_user_id, to_user_id, message, translated_message, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [taskId, studentId, task.company_id, studentQuestion, translatedQuestion]
    );

    res.json({
      success: true,
      data: {
        translatedQuestion,
        sent: true
      }
    });
  } catch (error) {
    next(error);
  }
}

export default {
  initiateRequirementConfirmation,
  analyzeStudentUnderstanding,
  provideInspirationalGuidance,
  celebrateProgressAndGuideNext,
  reviewSubmission,
  translateCompanyFeedback,
  translateStudentQuestion
};
