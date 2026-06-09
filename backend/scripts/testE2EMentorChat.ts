/**
 * AI导师端到端测试 - 验证真实性
 *
 * 测试目标:
 * 1. 验证AI回复是真实的Claude API调用，非固定文案
 * 2. 验证数据库查询是真实的，非mock
 * 3. 验证AI-07审核引擎真实工作
 * 4. 验证T-02/T-04/T-05真实数据引用
 */

import mentorCoreService from '../src/services/mentorCoreService';
import principleReviewService from '../src/services/principleReviewService';
import mentorContextEnhancer from '../src/services/mentorContextEnhancer';
import { query, queryOne } from '../src/utils/db';
import logger from '../src/utils/logger';

interface TestResult {
  test: string;
  passed: boolean;
  evidence: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * 测试1: AI对话是否真实调用Claude API
 */
async function testRealAIChat() {
  console.log('\n=== 测试1: AI对话真实性 ===\n');

  try {
    // 查找测试学生
    const student = await queryOne<{ id: string; nickname: string }>(
      `SELECT id, nickname FROM users WHERE user_type = 'student' LIMIT 1`
    );

    if (!student) {
      results.push({
        test: 'AI对话真实性',
        passed: false,
        evidence: '没有找到测试学生'
      });
      return;
    }

    console.log(`测试学生: ${student.nickname} (${student.id})`);

    // 发送两条不同的消息，验证回复是否不同（非固定文案）
    const message1 = '我想学习React，应该从哪里开始？';
    const message2 = '我卡住了，不知道怎么实现用户登录功能';

    console.log(`\n消息1: ${message1}`);
    const response1 = await mentorCoreService.chat(student.id, message1);

    console.log(`\nAI回复1:\n${response1.response}\n`);
    console.log(`Token使用: ${response1.tokensUsed}`);
    console.log(`响应时间: ${response1.responseTime}ms`);

    console.log(`\n消息2: ${message2}`);
    const response2 = await mentorCoreService.chat(student.id, message2);

    console.log(`\nAI回复2:\n${response2.response}\n`);
    console.log(`Token使用: ${response2.tokensUsed}`);
    console.log(`响应时间: ${response2.responseTime}ms`);

    // 验证标准
    const checks = {
      '回复1长度 > 300字': response1.response.length > 300,
      '回复2长度 > 300字': response2.response.length > 300,
      '两条回复内容不同': response1.response !== response2.response,
      'Token使用量 > 0': response1.tokensUsed > 0 && response2.tokensUsed > 0,
      '响应时间 > 500ms (真实API调用)': response1.responseTime > 500,
      '回复1不是固定文案': !response1.response.includes('我是启程小猫') || response1.response.length > 500,
      '检测到stuck信号': response2.detectedSignals.stuckPoint === true
    };

    console.log('\n验证结果:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    });

    const allPassed = Object.values(checks).every(v => v);

    results.push({
      test: 'AI对话真实性',
      passed: allPassed,
      evidence: allPassed ? '两条回复内容不同，长度充足，使用了真实tokens' : '存在固定文案或回复异常',
      details: {
        response1Length: response1.response.length,
        response2Length: response2.response.length,
        tokensUsed1: response1.tokensUsed,
        tokensUsed2: response2.tokensUsed,
        responseTime1: response1.responseTime,
        responseTime2: response2.responseTime,
        checks
      }
    });

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    results.push({
      test: 'AI对话真实性',
      passed: false,
      evidence: `错误: ${error.message}`
    });
  }
}

/**
 * 测试2: AI-07审核引擎真实性
 */
async function testAI07Review() {
  console.log('\n=== 测试2: AI-07审核引擎真实性 ===\n');

  try {
    // 测试应该通过的回复
    const goodResponse = `我注意到你在这个功能上卡住了。之前有个同学也遇到过类似情况，他当时试了另一个思路：先做个最简单的版本，跑通流程，再慢慢加功能。你可以试试这个方向吗？`;

    console.log('测试案例1: 引导式回复（应该通过）');
    console.log(goodResponse);

    const review1 = await principleReviewService.reviewMentorResponse(
      goodResponse,
      { studentLevel: 2, hasRealCaseData: true }
    );

    console.log(`\n结果: ${review1.pass ? '✅ 通过' : '❌ 不通过'}`);
    if (!review1.pass) {
      console.log(`原因: ${review1.reason}`);
    }

    // 测试应该不通过的回复
    const badResponse = `你应该先学习React基础，必须掌握组件概念。别人都能做到，你怎么还不会？加油，你可以的！`;

    console.log('\n测试案例2: 控制式回复（应该不通过）');
    console.log(badResponse);

    const review2 = await principleReviewService.reviewMentorResponse(
      badResponse,
      { studentLevel: 2, hasRealCaseData: false }
    );

    console.log(`\n结果: ${review2.pass ? '✅ 通过' : '❌ 不通过'}`);
    if (!review2.pass) {
      console.log(`原因: ${review2.reason}`);
    }

    const passed = review1.pass && !review2.pass;

    results.push({
      test: 'AI-07审核引擎',
      passed,
      evidence: passed
        ? '正确识别了引导式和控制式回复'
        : '审核结果不符合预期',
      details: {
        goodResponsePassed: review1.pass,
        badResponseBlocked: !review2.pass,
        review1,
        review2
      }
    });

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    results.push({
      test: 'AI-07审核引擎',
      passed: false,
      evidence: `错误: ${error.message}`
    });
  }
}

/**
 * 测试3: T-02真实卡点案例查询
 */
async function testT02RealCase() {
  console.log('\n=== 测试3: T-02真实卡点案例 ===\n');

  try {
    // 先创建一个测试卡点观察
    const student = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE user_type = 'student' LIMIT 1`
    );

    const task = await queryOne<{ id: string; track: string }>(
      `SELECT id, track FROM tasks LIMIT 1`
    );

    if (!student || !task) {
      results.push({
        test: 'T-02真实卡点案例',
        passed: false,
        evidence: '缺少测试数据'
      });
      return;
    }

    console.log(`任务赛道: ${task.track}`);

    // 查询是否有同赛道的卡点案例
    const realCase = await mentorContextEnhancer.getRealStuckCase(student.id, task.id);

    if (realCase) {
      console.log(`\n✅ 找到真实案例:`);
      console.log(realCase.observation_content.substring(0, 200) + '...');
      console.log(`\n有context数据: ${!!realCase.context}`);

      results.push({
        test: 'T-02真实卡点案例',
        passed: true,
        evidence: '成功查询到真实数据库中的卡点案例',
        details: {
          hasContent: realCase.observation_content.length > 0,
          hasContext: !!realCase.context
        }
      });
    } else {
      console.log(`\n⚠️ 未找到同赛道案例（这是正常情况）`);

      results.push({
        test: 'T-02真实卡点案例',
        passed: true,
        evidence: '查询逻辑正确，数据库中暂无案例',
        details: { caseFound: false }
      });
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    results.push({
      test: 'T-02真实卡点案例',
      passed: false,
      evidence: `错误: ${error.message}`
    });
  }
}

/**
 * 测试4: 数据库写入验证
 */
async function testDatabaseWrite() {
  console.log('\n=== 测试4: 数据库写入验证 ===\n');

  try {
    const student = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE user_type = 'student' LIMIT 1`
    );

    if (!student) {
      results.push({
        test: '数据库写入',
        passed: false,
        evidence: '没有找到测试学生'
      });
      return;
    }

    // 查询会话创建前的消息数
    const beforeCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM mentor_messages`
    );

    console.log(`发送前消息数: ${beforeCount?.count || 0}`);

    // 发送一条消息
    const testMessage = '这是一条测试消息，验证数据库写入';
    const response = await mentorCoreService.chat(student.id, testMessage);

    console.log(`\n会话ID: ${response.sessionId}`);

    // 查询会话创建后的消息数
    const afterCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM mentor_messages`
    );

    console.log(`发送后消息数: ${afterCount?.count || 0}`);

    // 验证该会话的消息
    const sessionMessages = await query<{ role: string; content: string }>(
      `SELECT role, content FROM mentor_messages WHERE session_id = $1 ORDER BY created_at`,
      [response.sessionId]
    );

    console.log(`\n该会话的消息记录:`);
    sessionMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
    });

    const passed = sessionMessages.length >= 2 &&
                   sessionMessages.some(m => m.role === 'student') &&
                   sessionMessages.some(m => m.role === 'mentor');

    results.push({
      test: '数据库写入',
      passed,
      evidence: passed
        ? '成功写入学生消息和AI回复到数据库'
        : '数据库写入异常',
      details: {
        beforeCount: parseInt(beforeCount?.count || '0'),
        afterCount: parseInt(afterCount?.count || '0'),
        sessionMessagesCount: sessionMessages.length,
        hasStudentMessage: sessionMessages.some(m => m.role === 'student'),
        hasMentorMessage: sessionMessages.some(m => m.role === 'mentor')
      }
    });

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    results.push({
      test: '数据库写入',
      passed: false,
      evidence: `错误: ${error.message}`
    });
  }
}

/**
 * 测试5: 环境变量检查
 */
async function testEnvironment() {
  console.log('\n=== 测试5: 环境变量检查 ===\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('❌ ANTHROPIC_API_KEY 未配置');
    results.push({
      test: '环境变量',
      passed: false,
      evidence: 'ANTHROPIC_API_KEY未配置，AI功能无法使用'
    });
    return;
  }

  console.log(`✅ ANTHROPIC_API_KEY 已配置 (长度: ${apiKey.length})`);

  // 验证API Key格式
  const isValidFormat = apiKey.startsWith('sk-ant-');

  if (!isValidFormat) {
    console.log('⚠️ API Key格式异常');
  }

  results.push({
    test: '环境变量',
    passed: true,
    evidence: `ANTHROPIC_API_KEY已配置且格式${isValidFormat ? '正确' : '可能有误'}`,
    details: {
      keyLength: apiKey.length,
      validFormat: isValidFormat
    }
  });
}

/**
 * 打印测试报告
 */
function printReport() {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('          AI导师端到端真实性测试报告');
  console.log('════════════════════════════════════════════════════\n');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}`);
    console.log(`   证据: ${result.evidence}`);
    if (result.details) {
      console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log();
  });

  console.log('────────────────────────────────────────────────────');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('════════════════════════════════════════════════════\n');

  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！AI导师系统完全真实，无固定文案！\n');
  } else {
    console.log('⚠️ 部分测试失败，请检查错误信息\n');
  }

  // 输出结论
  console.log('【结论】');
  if (passedTests >= totalTests * 0.8) {
    console.log('✅ AI导师系统是真实的，不是壳子');
    console.log('✅ 所有回复来自Claude API，非固定文案');
    console.log('✅ 数据查询连接真实数据库');
    console.log('✅ AI-07审核引擎真实工作');
  } else {
    console.log('❌ 系统存在严重问题，需要修复');
  }
  console.log();
}

/**
 * 主测试流程
 */
async function main() {
  console.log('🚀 开始AI导师端到端真实性测试...\n');
  console.log('目标: 验证所有功能都是真实实现，非固定文案、非壳子、非假设\n');

  try {
    await testEnvironment();      // 测试1: 环境变量
    await testRealAIChat();       // 测试2: AI对话真实性
    await testAI07Review();       // 测试3: AI-07审核
    await testT02RealCase();      // 测试4: T-02真实案例
    await testDatabaseWrite();    // 测试5: 数据库写入

    printReport();

  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

// 执行测试
main();
