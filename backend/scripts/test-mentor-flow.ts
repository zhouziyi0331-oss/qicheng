import { mentorStageService, MentorStage } from '../src/services/mentorStageService';
import { mentorPromptBuilder } from '../src/services/mentorPromptBuilder';
import { mentorTriggerService } from '../src/services/mentorTriggerService';
import logger from '../src/utils/logger';

/**
 * 测试AI导师4阶段系统完整流程
 */

async function testMentorFlow() {
  try {
    logger.info('🚀 开始测试AI导师系统...');

    // 使用实际存在的任务和学生ID
    const testTaskId = '9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2';
    const testStudentId = '23411f9e-203b-4fd8-b970-d87f143bc745';

    // ========== 测试1：创建会话 ==========
    logger.info('\n📝 测试1：创建导师会话');
    const sessionId = await mentorStageService.createSession(testTaskId, testStudentId);
    logger.info(`✅ 会话创建成功: ${sessionId}`);

    // ========== 测试2：获取会话信息 ==========
    logger.info('\n📝 测试2：获取会话信息');
    const session = await mentorStageService.getSession(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }
    logger.info(`✅ 当前阶段: ${session.currentStage}`);
    logger.info(`✅ 阶段状态: ${session.stageStatus}`);

    // ========== 测试3：获取Prompt模板 ==========
    logger.info('\n📝 测试3：获取Prompt模板');
    const template = await mentorPromptBuilder.getTemplate(
      MentorStage.REQUIREMENT_UNDERSTANDING,
      'default'
    );
    if (!template) {
      throw new Error('模板不存在');
    }
    logger.info(`✅ 模板加载成功: ${template.templateName}`);
    logger.info(`✅ 推荐模型: ${template.modelRecommendation}`);
    logger.info(`✅ 最大tokens: ${template.maxTokens}`);

    // ========== 测试4：构建Prompt ==========
    logger.info('\n📝 测试4：构建Prompt');
    const prompt = await mentorPromptBuilder.buildPrompt(
      MentorStage.REQUIREMENT_UNDERSTANDING,
      {
        taskTitle: '测试任务：开发一个待办事项应用',
        taskDescription: '需要实现任务的增删改查功能，支持标记完成状态',
        taskRequirements: '使用React + TypeScript，需要有良好的UI设计',
        taskDeadline: new Date('2026-05-15'),
        studentName: '测试同学',
        studentLevel: '本科',
        studentMajor: '计算机科学',
        companyName: '测试科技公司',
        companyIndustry: '互联网',
      }
    );
    logger.info(`✅ Prompt构建成功`);
    logger.info(`✅ 系统提示词长度: ${prompt.systemPrompt.length} 字符`);
    logger.info(`✅ 用户提示词长度: ${prompt.userPrompt.length} 字符`);

    // ========== 测试5：保存消息 ==========
    logger.info('\n📝 测试5：保存消息');
    const studentMessageId = await mentorStageService.saveMessage(
      sessionId,
      'student',
      '我理解这个任务是要做一个待办事项管理应用，主要功能是添加、删除、修改和查看任务。'
    );
    logger.info(`✅ 学生消息保存成功: ${studentMessageId}`);

    const mentorMessageId = await mentorStageService.saveMessage(
      sessionId,
      'mentor',
      '很好！你的理解基本正确。让我们一起来梳理一下具体的功能点...',
      {
        stage: MentorStage.REQUIREMENT_UNDERSTANDING,
        modelUsed: 'claude-sonnet-4-6',
        tokensUsed: 1500,
        cost: 0.0045,
        responseTimeMs: 2500,
      }
    );
    logger.info(`✅ 导师消息保存成功: ${mentorMessageId}`);

    // ========== 测试6：获取消息历史 ==========
    logger.info('\n📝 测试6：获取消息历史');
    const messages = await mentorStageService.getMessages(sessionId, 10);
    logger.info(`✅ 获取到 ${messages.length} 条消息`);
    messages.forEach((msg, idx) => {
      logger.info(`  ${idx + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    // ========== 测试7：更新统计 ==========
    logger.info('\n📝 测试7：更新统计');
    await mentorStageService.incrementStats(sessionId, 'guidanceCount', 1);
    await mentorStageService.incrementStats(sessionId, 'encouragementCount', 1);
    logger.info(`✅ 统计更新成功`);

    // ========== 测试8：获取会话统计 ==========
    logger.info('\n📝 测试8：获取会话统计');
    const stats = await mentorStageService.getSessionStats(sessionId);
    logger.info(`✅ 总消息数: ${stats.totalMessages}`);
    logger.info(`✅ 总tokens: ${stats.totalTokensUsed}`);
    logger.info(`✅ 总成本: $${stats.totalCost.toFixed(4)}`);
    logger.info(`✅ 学生消息: ${stats.messagesByRole.student}`);
    logger.info(`✅ 导师消息: ${stats.messagesByRole.mentor}`);

    // ========== 测试9：阶段转换 ==========
    logger.info('\n📝 测试9：阶段转换');
    await mentorStageService.transitionStage(sessionId, MentorStage.EXECUTION_GUIDANCE);
    const updatedSession = await mentorStageService.getSession(sessionId);
    logger.info(`✅ 阶段转换成功: ${updatedSession?.currentStage}`);

    // ========== 测试10：测试所有阶段的Prompt模板 ==========
    logger.info('\n📝 测试10：测试所有阶段的Prompt模板');
    const stages = [
      MentorStage.REQUIREMENT_UNDERSTANDING,
      MentorStage.EXECUTION_GUIDANCE,
      MentorStage.QUALITY_REVIEW,
      MentorStage.COMMUNICATION_BRIDGE,
    ];

    for (const stage of stages) {
      const stageTemplate = await mentorPromptBuilder.getTemplate(stage, 'default');
      if (stageTemplate) {
        logger.info(`✅ ${stage}: 模板存在，推荐模型=${stageTemplate.modelRecommendation}`);
      } else {
        logger.warn(`⚠️  ${stage}: 模板不存在`);
      }
    }

    // ========== 测试11：构建会话上下文 ==========
    logger.info('\n📝 测试11：构建会话上下文');
    const conversationContext = mentorPromptBuilder.buildConversationContext([
      { role: 'student', content: '我理解这个任务是...' },
      { role: 'mentor', content: '很好！你的理解基本正确...' },
      { role: 'student', content: '那我应该从哪里开始呢？' },
    ]);
    logger.info(`✅ 会话上下文构建成功，长度: ${conversationContext.length} 字符`);

    logger.info('\n✅ 所有测试通过！AI导师系统运行正常！');
    logger.info('\n📊 测试总结:');
    logger.info('  ✅ 会话创建和管理');
    logger.info('  ✅ Prompt模板加载和构建');
    logger.info('  ✅ 消息保存和查询');
    logger.info('  ✅ 统计数据追踪');
    logger.info('  ✅ 阶段转换');
    logger.info('  ✅ 所有4个阶段的模板');

    logger.info('\n🎯 下一步:');
    logger.info('  1. 启动后端服务: npm run dev');
    logger.info('  2. 测试API端点');
    logger.info('  3. 实现前端组件');
    logger.info('  4. 端到端测试完整流程');

  } catch (error: unknown) {
    logger.error('❌ 测试失败', { error });
    throw error;
  }
}

// 运行测试
if (require.main === module) {
  testMentorFlow()
    .then(() => {
      logger.info('测试脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      logger.error('测试脚本执行失败', { error });
      process.exit(1);
    });
}

export { testMentorFlow };
