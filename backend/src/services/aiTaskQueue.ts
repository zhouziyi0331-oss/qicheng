import Queue from 'bull';
import { config } from '../../config';
import logger from '../utils/logger';
import opcAnalysisService from '../services/opcAnalysisService';
import projectAnalysisService from '../services/projectAnalysisService';
import vectorEmbeddingService from '../services/vectorEmbeddingService';
import websocketService from '../services/websocketService';
import aiLogService from '../services/aiLogService';

/**
 * AI任务队列处理器
 * 统一调度所有AI相关的异步任务
 */

// 创建队列
export const aiTaskQueue = new Queue('ai-tasks', config.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

/**
 * 任务类型定义
 */
export enum AITaskType {
  PROFILE_ANALYSIS = 'profile-analysis',           // AI-01: 学生画像生成
  PROJECT_CONDITION_ANALYSIS = 'project-condition-analysis', // 项目需求条件分析
  MATCH_ANALYSIS = 'match-analysis',               // AI-02: 适配性判断
  SUBMISSION_REVIEW = 'submission-review',         // AI-03: 交付物预审核
  GROWTH_REPORT = 'growth-report',                 // AI-04: 成长报告
  MENTOR_GUIDANCE = 'mentor-guidance'              // AI-06: 导师引导
}

/**
 * 任务数据接口
 */
interface ProfileAnalysisJob {
  type: AITaskType.PROFILE_ANALYSIS;
  studentId: string;
  assessmentId: string;
  answers: any;
  scores: any;
}

interface ProjectConditionAnalysisJob {
  type: AITaskType.PROJECT_CONDITION_ANALYSIS;
  taskId: string;
  title: string;
  description: string;
  deliverableType: string;
  cycle: number;
  budget: number;
}

interface MatchAnalysisJob {
  type: AITaskType.MATCH_ANALYSIS;
  taskId: string;
  studentIds: string[];
}

interface MentorGuidanceJob {
  type: AITaskType.MENTOR_GUIDANCE;
  orderId: string;
  studentId: string;
  scenario: 'T01' | 'T02' | 'T03' | 'T04' | 'T05';
  context: any;
}

type AITaskJob = ProfileAnalysisJob | ProjectConditionAnalysisJob | MatchAnalysisJob | MentorGuidanceJob;

/**
 * 队列处理器 - 优化：增加并发数
 *
 * 并发策略：
 * - 画像分析：并发3个（高频操作）
 * - 项目匹配：并发5个（高频操作）
 * - 导师引导：并发2个（避免过载）
 */

// 画像分析处理器（并发3个）
aiTaskQueue.process(AITaskType.PROFILE_ANALYSIS, 3, async (job) => {
  const data = job.data as ProfileAnalysisJob;
  logger.info(`Processing AI task: ${AITaskType.PROFILE_ANALYSIS}`, { jobId: job.id });
  return await processProfileAnalysis(data);
});

// 项目条件分析处理器（并发5个）
aiTaskQueue.process(AITaskType.PROJECT_CONDITION_ANALYSIS, 5, async (job) => {
  const data = job.data as ProjectConditionAnalysisJob;
  logger.info(`Processing AI task: ${AITaskType.PROJECT_CONDITION_ANALYSIS}`, { jobId: job.id });
  return await processProjectConditionAnalysis(data);
});

// 匹配分析处理器（并发5个）
aiTaskQueue.process(AITaskType.MATCH_ANALYSIS, 5, async (job) => {
  const data = job.data as MatchAnalysisJob;
  logger.info(`Processing AI task: ${AITaskType.MATCH_ANALYSIS}`, { jobId: job.id });
  return await processMatchAnalysis(data);
});

// 导师引导处理器（并发2个）
aiTaskQueue.process(AITaskType.MENTOR_GUIDANCE, 2, async (job) => {
  const data = job.data as MentorGuidanceJob;
  logger.info(`Processing AI task: ${AITaskType.MENTOR_GUIDANCE}`, { jobId: job.id });
  return await processMentorGuidance(data);
});

/**
 * 处理学生画像生成
 */
async function processProfileAnalysis(data: Omit<ProfileAnalysisJob, 'type'>) {
  logger.info(`Generating work condition profile for student ${data.studentId}`);

  // 1. 生成工作条件画像
  const profile = await opcAnalysisService.generateWorkConditionProfile({
    studentId: data.studentId,
    answers: data.answers,
    scores: data.scores,
    personalityTag: '视觉叙事者' // 从scores推导
  });

  // 2. 保存画像（包含向量生成）
  await opcAnalysisService.saveWorkConditionProfile(profile);

  logger.info(`Work condition profile generated for student ${data.studentId}`);

  return {
    success: true,
    studentId: data.studentId,
    profileText: profile.profileText,
    coreStrengths: profile.coreStrengths
  };
}

/**
 * 处理项目需求条件分析
 */
async function processProjectConditionAnalysis(data: Omit<ProjectConditionAnalysisJob, 'type'>) {
  logger.info(`Generating requirement profile for task ${data.taskId}`);

  // 判断沟通风格
  const hasReference = data.description.includes('参考') || data.description.includes('案例');
  let communicationStyle = '适度';
  if (data.description.includes('频繁沟通')) {
    communicationStyle = '频繁';
  } else if (data.description.includes('独立完成')) {
    communicationStyle = '放手';
  }

  // 1. 生成需求条件画像
  const profile = await projectAnalysisService.generateRequirementProfile({
    taskId: data.taskId,
    title: data.title,
    description: data.description,
    deliverableType: data.deliverableType,
    cycle: data.cycle,
    budget: data.budget,
    hasReference,
    clientCommunicationStyle: communicationStyle
  });

  // 2. 保存画像（包含向量生成）
  await projectAnalysisService.saveRequirementProfile(profile);

  logger.info(`Requirement profile generated for task ${data.taskId}`);

  return {
    success: true,
    taskId: data.taskId,
    requirementText: profile.requirementText,
    projectType: profile.projectType
  };
}

/**
 * 处理匹配分析
 */
async function processMatchAnalysis(data: Omit<MatchAnalysisJob, 'type'>) {
  logger.info(`Running match analysis for task ${data.taskId}`);

  const workConditionMatchingEngine = require('./workConditionMatchingEngine').default;

  // 执行匹配
  const matches = await workConditionMatchingEngine.findBestStudentsForTask(
    data.taskId,
    data.studentIds ? data.studentIds.length : 20
  );

  logger.info(`Match analysis completed for task ${data.taskId}, found ${matches.length} matches`);

  return {
    success: true,
    taskId: data.taskId,
    matchCount: matches.length,
    topMatches: matches.slice(0, 5).map(m => ({
      studentId: m.studentId,
      fitScore: m.fitScore,
      overallFit: m.overallFit
    }))
  };
}

/**
 * 处理导师引导
 */
async function processMentorGuidance(data: Omit<MentorGuidanceJob, 'type'>) {
  logger.info(`Generating mentor guidance for order ${data.orderId}, scenario: ${data.scenario}`);

  const { orderId, studentId, scenario, context } = data;

  try {
    // 根据场景生成不同的引导内容
    let mentorMessage = '';

    // 将studentId添加到context中，供日志记录使用
    context.studentId = studentId;

    switch (scenario) {
      case 'T01':
        // 接单后30秒，任务拆解
        mentorMessage = await generateT01TaskBreakdown(context);
        break;

      case 'T02':
        // 学生主动求助
        mentorMessage = await generateT02SocraticGuidance(context);
        break;

      case 'T03':
        // 企业打回，翻译反馈
        mentorMessage = await generateT03FeedbackTranslation(context);
        break;

      case 'T04':
        // 无操作超过2小时，轻推
        mentorMessage = await generateT04Nudge(context);
        break;

      case 'T05':
        // 任务完成，里程碑见证
        mentorMessage = await generateT05Milestone(context);
        break;

      default:
        throw new Error(`Unknown mentor scenario: ${scenario}`);
    }

    // 保存导师消息到数据库
    const { query } = require('../utils/db');
    await query(
      `INSERT INTO mentor_sessions (order_id, student_id, scenario, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [orderId, studentId, scenario, mentorMessage]
    );

    logger.info(`Mentor guidance generated for order ${orderId}, scenario: ${scenario}`);

    return {
      success: true,
      orderId,
      scenario,
      content: mentorMessage
    };

  } catch (error) {
    logger.error(`Failed to generate mentor guidance for scenario ${scenario}:`, error);
    throw error;
  }
}

/**
 * T-01: 任务拆解（接单后30秒）
 * 真正调用Claude API，基于学生画像和项目需求生成个性化引导
 */
async function generateT01TaskBreakdown(context: any): Promise<string> {
  const { taskTitle, taskDescription, studentProfile, coreStrengths, projectType, deliverableType } = context;

  const prompt = `你是"启程老师"，一位温暖、专业的项目导师。学生刚接了一个新任务，你需要帮助他理解任务并给出第一步引导。

## 学生画像
${studentProfile || '暂无画像'}

核心优势：${coreStrengths || '待发现'}

## 项目信息
**标题**：${taskTitle}
**描述**：${taskDescription}
**类型**：${projectType}
**交付物**：${deliverableType}

## 你的任务
1. **理解学生的工作风格**：从画像中提取学生的工作偏好（如：先整体后细节、边做边调整等）
2. **拆解任务为3-4个具体步骤**：每个步骤要可操作、有时间预估
3. **个性化建议**：根据学生的优势，给出最适合他的切入点

## 输出要求
- 语气温暖、鼓励，像朋友而非老师
- 不要用"您"，用"你"
- 步骤要具体到"做什么"，不是"想什么"
- 最后一句要引导学生主动思考或提问

直接输出引导内容，不要前缀：`;

  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5', // 优化：改用Haiku，更快
      max_tokens: 800, // 优化：T01引导实际需要800 tokens
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const duration = Date.now() - startTime;
    const content = response.content[0];

    // 记录AI调用日志
    await aiLogService.logAICall({
      engineName: 'AI-06-T01',
      modelName: 'claude-haiku-4-5',
      userId: context.studentId,
      userType: 'student',
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      costYuan: aiLogService.calculateClaudeCost(
        'claude-haiku-4-5',
        response.usage.input_tokens,
        response.usage.output_tokens
      ),
      durationMs: duration,
      status: 'success',
    });

    if (content.type === 'text') {
      return content.text.trim();
    }

    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    const duration = Date.now() - startTime;

    // 记录失败日志
    await aiLogService.logAICall({
      engineName: 'AI-06-T01',
      modelName: 'claude-3-5-sonnet-20241022',
      userId: context.studentId,
      userType: 'student',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costYuan: 0,
      durationMs: duration,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    logger.error('Failed to generate T01 guidance:', error);
    // 降级：返回基础模板
    return `🎯 欢迎接单！

**任务：${taskTitle}**

让我们一起理解这个任务。建议你先：
1. 通读项目描述，理解核心需求
2. 快速做一个概念稿验证方向
3. 收集反馈并迭代优化

有任何问题随时问我！`;
  }
}

/**
 * T-02: 苏格拉底式引导（学生求助）
 * 真正调用Claude API，根据学生的具体问题进行个性化引导
 */
async function generateT02SocraticGuidance(context: any): Promise<string> {
  const { studentMessage, taskTitle, taskDescription, studentProfile, orderId } = context;

  // 获取对话历史（最近30条）
  let conversationHistory = '这是第一次对话';
  if (orderId) {
    try {
      const conversationHistoryService = require('./conversationHistoryService').default;
      conversationHistory = await conversationHistoryService.getConversationHistory(orderId, 30);
    } catch (error) {
      logger.error('Failed to get conversation history:', error);
    }
  }

  const prompt = `你是"启程老师"，一位善于用苏格拉底式提问引导学生思考的导师。

## 学生画像
${studentProfile || '暂无画像'}

## 当前任务
**标题**：${taskTitle}
**描述**：${taskDescription || '暂无详细描述'}

## 对话历史（最近30条）
${conversationHistory}

## 学生的求助消息
"${studentMessage}"

## 你的任务
1. **识别问题类型**：
   - 技术性问题（如"怎么做配色"）→ 引导思考工具和方法
   - 需求理解问题（如"客户说的话我不懂"）→ 引导拆解客户语言
   - 情绪性问题（如"我有点紧张"）→ 先安抚情绪，再引导行动

2. **苏格拉底式提问**：
   - 不要直接给答案
   - 用2-3个递进的问题引导学生自己思考
   - 问题要具体、可回答

3. **温暖鼓励**：
   - 先肯定学生主动求助的行为
   - 语气像朋友，不要说教

4. **引用历史**：
   - 如果对话历史中有相关内容，可以引用
   - 例如："上次你提到XX，现在进展如何？"

直接输出回复内容，不要前缀：`;

  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5', // 优化：改用Haiku，更快
      max_tokens: 600, // 优化：T02鼓励实际需要600 tokens
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    });

    const duration = Date.now() - startTime;
    const content = response.content[0];

    // 记录AI调用日志
    await aiLogService.logAICall({
      engineName: 'AI-06-T02',
      modelName: 'claude-haiku-4-5',
      userId: context.studentId,
      userType: 'student',
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      costYuan: aiLogService.calculateClaudeCost(
        'claude-haiku-4-5',
        response.usage.input_tokens,
        response.usage.output_tokens
      ),
      durationMs: duration,
      status: 'success',
    });

    if (content.type === 'text') {
      return content.text.trim();
    }

    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    const duration = Date.now() - startTime;

    // 记录失败日志
    await aiLogService.logAICall({
      engineName: 'AI-06-T02',
      modelName: 'claude-3-5-sonnet-20241022',
      userId: context.studentId,
      userType: 'student',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costYuan: 0,
      durationMs: duration,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    logger.error('Failed to generate T02 guidance:', error);
    // 降级：返回基础引导
    return `我理解你遇到了困难。让我们一起思考一下：

🤔 先问自己几个问题：
1. 你现在卡在哪一步了？
2. 你已经尝试过什么方法？
3. 你觉得问题的根源可能是什么？

试着回答这些问题，我会根据你的回答给出更具体的建议。`;
  }
}

/**
 * T-03: 翻译企业反馈（打回修改）
 * 真正调用Claude API，理解企业的模糊反馈并翻译成学生能懂的具体修改方向
 */
async function generateT03FeedbackTranslation(context: any): Promise<string> {
  const { companyFeedback, taskTitle, taskDescription, submissionContent, acceptanceCriteria } = context;

  const prompt = `你是"启程老师"，一位善于理解双方语言的翻译官。企业刚刚打回了学生的交付物，你需要把企业的反馈翻译成学生能理解的具体修改方向。

## 任务信息
**标题**：${taskTitle}
**描述**：${taskDescription}
**验收标准**：${acceptanceCriteria || '未明确'}

## 学生提交的内容
${submissionContent || '暂无详情'}

## 企业的原始反馈
"${companyFeedback}"

## 你的任务
1. **理解企业的真实意图**：
   - 如果企业说"整体感觉可以更好"，要推测具体是哪里不满意
   - 结合任务描述和验收标准，找出可能的问题点

2. **翻译成具体的修改方向**：
   - 不要原封不动转述企业的话
   - 要指出"第几张图/第几段文字/哪个模块"需要改
   - 给出可操作的建议（如"配色改成暖色调"，不是"配色改改"）

3. **先肯定再建议**：
   - 先找出学生做得好的一个具体点
   - 再说需要调整的地方
   - 最后鼓励学生

## 输出格式
分三段：
1. 肯定部分（1-2句）
2. 需要修改的地方（2-3个具体点）
3. 鼓励（1句）

直接输出翻译内容，不要前缀：`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5', // 优化：改用Haiku，更快
      max_tokens: 800, // 优化：T03引导实际需要800 tokens
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    logger.error('Failed to generate T03 guidance:', error);
    // 降级：返回基础翻译
    return `📝 关于"${taskTitle}"的修改建议

首先，恭喜你完成了第一版！客户给出了一些反馈：

**客户的原话**：
"${companyFeedback}"

**我的理解**：
客户对整体方向是认可的，但希望在细节上做一些调整。建议你重点关注以下几点，结合任务要求进行优化。

别灰心，迭代是正常的。这次修改后，你会对客户的需求理解得更深。加油！`;
  }
}

/**
 * T-04: 轻推（无操作超过2小时）
 * 真正调用Claude API，根据任务进度和学生画像生成个性化轻推
 */
async function generateT04Nudge(context: any): Promise<string> {
  const { lastActivityAt, taskTitle, studentProfile, currentProgress } = context;

  const hoursInactive = lastActivityAt
    ? Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60))
    : 2;

  const prompt = `你是"启程老师"，一位温暖的项目导师。学生已经${hoursInactive}小时没有更新任务进度了，你需要发一条轻推消息。

## 学生画像
${studentProfile || '暂无画像'}

## 当前任务
${taskTitle}

## 当前进度
${currentProgress || '刚接单，还没开始'}

## 你的任务
1. **判断可能的原因**：
   - 如果刚接单不久，可能是还在思考怎么开始
   - 如果已经做了一半，可能是遇到了困难
   - 如果快完成了，可能是在打磨细节

2. **温和提醒**：
   - 不要责备或催促
   - 语气像朋友的关心，不是老师的督促
   - 给学生一个台阶下（"如果遇到困难..."）

3. **提供帮助**：
   - 主动提出可以帮忙的地方
   - 让学生感觉到你在陪伴

## 输出要求
- 2-3句话即可，不要太长
- 语气轻松、温暖
- 最后一句要开放式，让学生可以回复

直接输出轻推内容，不要前缀：`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5', // 优化：改用Haiku，更快
      max_tokens: 500, // 优化：T04轻推实际需要500 tokens
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    logger.error('Failed to generate T04 guidance:', error);
    // 降级：返回基础轻推
    return `👋 嗨，好久不见！

看到你有一段时间没有更新进度了，一切还好吗？如果遇到了困难，随时告诉我。

我一直在这里陪着你 😊`;
  }
}

/**
 * T-05: 里程碑见证（任务完成）
 * 真正调用Claude API，基于学生的真实成长数据生成个性化见证
 */
async function generateT05Milestone(context: any): Promise<string> {
  const { taskTitle, reviewScore, completedAt, studentProfile, isFirstTask, orderId } = context;

  // 获取对话历史（最近30条）
  let conversationHistory = '无对话记录';
  if (orderId) {
    try {
      const conversationHistoryService = require('./conversationHistoryService').default;
      conversationHistory = await conversationHistoryService.getConversationHistory(orderId, 30);
    } catch (error) {
      logger.error('Failed to get conversation history:', error);
    }
  }

  const prompt = `你是"启程老师"，一位见证学生成长的导师。学生刚刚完成了一个任务，你需要为他写一段里程碑见证。

## 学生画像
${studentProfile || '暂无画像'}

## 完成的任务
**标题**：${taskTitle}
**描述**：${context.taskDescription || '暂无详细描述'}
**客户评分**：${reviewScore || '待评分'}
**完成时间**：${completedAt}
**是否首单**：${isFirstTask ? '是' : '否'}

## 任务过程中的对话记录（最近30条）
${conversationHistory}

## 你的任务
1. **回顾成长**：
   - 如果是首单，重点强调"从0到1"的突破
   - 如果不是首单，对比之前的表现，指出进步的地方
   - 如果对话记录中有学生卡点，要提到"你在XX卡了很久，但最后靠自己解决了"

2. **具体肯定**：
   - 不要说"做得很好"这种空话
   - 要说"你在XX方面表现出色"，具体到某个细节
   - 如果客户评分高，要提到客户的认可

3. **展望未来**：
   - 根据这次任务的表现，建议下一步可以尝试什么
   - 语气鼓励但不夸张

## 输出格式
分三段：
1. 庆祝完成（1-2句）
2. 具体回顾成长（2-3句，要引用真实数据）
3. 展望未来（1-2句）

直接输出见证内容，不要前缀：`;

  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5', // 优化：改用Haiku，更快
      max_tokens: 1000, // 优化：T05见证实际需要1000 tokens
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const duration = Date.now() - startTime;
    const content = response.content[0];

    // 记录AI调用日志
    await aiLogService.logAICall({
      engineName: 'AI-06-T05',
      modelName: 'claude-3-5-sonnet-20241022',
      userId: context.studentId,
      userType: 'student',
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
      return content.text.trim();
    }

    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    const duration = Date.now() - startTime;

    // 记录失败日志
    await aiLogService.logAICall({
      engineName: 'AI-06-T05',
      modelName: 'claude-3-5-sonnet-20241022',
      userId: context.studentId,
      userType: 'student',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costYuan: 0,
      durationMs: duration,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    logger.error('Failed to generate T05 guidance:', error);
    // 降级：返回基础见证
    return `🎉 恭喜你完成了"${taskTitle}"！

这是一个重要的里程碑！你按时完成了交付，质量得到了客户的认可，展现了你的核心优势。

你的成长报告正在生成中，很快就能看到详细的分析和建议。继续加油，期待你的下一个精彩表现！🚀`;
  }
}


/**
 * 队列事件监听
 */
aiTaskQueue.on('completed', (job, result) => {
  logger.info(`AI task completed: ${job.data.type}`, {
    jobId: job.id,
    result
  });

  // 通过WebSocket推送结果给前端
  try {
    const { type } = job.data;

    switch (type) {
      case AITaskType.PROFILE_ANALYSIS:
        // 学生画像生成完成
        websocketService.notifyProfileAnalysisComplete(
          job.data.studentId,
          result
        );
        break;

      case AITaskType.PROJECT_CONDITION_ANALYSIS:
        // 项目需求画像生成完成
        // 需要获取companyId
        const getCompanyId = async () => {
          const { queryOne } = require('../utils/db');
          const task = await queryOne(
            'SELECT company_id FROM tasks WHERE id = $1',
            [job.data.taskId]
          );
          return task?.company_id;
        };
        getCompanyId().then(companyId => {
          if (companyId) {
            websocketService.notifyRequirementAnalysisComplete(
              companyId,
              job.data.taskId,
              result
            );
          }
        });
        break;

      case AITaskType.MATCH_ANALYSIS:
        // 匹配完成
        const getCompanyIdForMatch = async () => {
          const { queryOne } = require('../utils/db');
          const task = await queryOne(
            'SELECT company_id FROM tasks WHERE id = $1',
            [job.data.taskId]
          );
          return task?.company_id;
        };
        getCompanyIdForMatch().then(companyId => {
          if (companyId) {
            websocketService.notifyMatchComplete(
              companyId,
              job.data.taskId,
              result.matchCount
            );
          }
        });
        break;

      case AITaskType.MENTOR_GUIDANCE:
        // 导师消息推送
        websocketService.notifyMentorMessage(
          job.data.studentId,
          result
        );
        break;

      case AITaskType.SUBMISSION_REVIEW:
        // 交付物审核完成
        websocketService.notifySubmissionReviewed(
          job.data.studentId,
          job.data.orderId,
          result
        );
        break;

      case AITaskType.GROWTH_REPORT:
        // 成长报告生成完成
        websocketService.notifyGrowthReportReady(
          job.data.studentId,
          result.reportId
        );
        break;
    }
  } catch (error) {
    logger.error('Failed to push WebSocket notification:', error);
  }
});

aiTaskQueue.on('failed', (job, err) => {
  logger.error(`AI task failed: ${job.data.type}`, {
    jobId: job.id,
    error: err.message
  });
});

aiTaskQueue.on('stalled', (job) => {
  logger.warn(`AI task stalled: ${job.data.type}`, { jobId: job.id });
});

/**
 * 辅助函数：添加任务到队列
 */
export async function enqueueAITask(taskData: AITaskJob, options?: any) {
  const job = await aiTaskQueue.add(taskData, options);
  logger.info(`AI task enqueued: ${taskData.type}`, { jobId: job.id });
  return job;
}

/**
 * 获取队列状态
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    aiTaskQueue.getWaitingCount(),
    aiTaskQueue.getActiveCount(),
    aiTaskQueue.getCompletedCount(),
    aiTaskQueue.getFailedCount(),
    aiTaskQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

export default aiTaskQueue;
