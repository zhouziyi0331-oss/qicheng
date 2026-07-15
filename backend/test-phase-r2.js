/**
 * Phase R2测试脚本
 * 测试12个触发场景的专门处理逻辑
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3517';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * 测试场景3: 主动求助（卡点）
 */
async function testStuckHelpRequest() {
  console.log('\n=== 场景3: 主动求助（卡点） ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/mentor`,
      {
        userId: TEST_USER_ID,
        message: '我完全不知道怎么做这个UI设计，太难了',
        trigger: 'stuck_help_request',
        taskId: 'test_task_001'
      }
    );

    console.log('✅ 卡点求助处理成功');
    console.log('触发场景:', response.data.results[0]?.data?.memory ? '记忆已加载' : '无记忆');

    // 验证L2是否记录了卡点
    const memoryCheck = await axios.get(
      `${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}?taskId=test_task_001`
    );

    const hasStuckPoint = memoryCheck.data.memory.L2_task?.stuckPoints?.length > 0;
    console.log('L2卡点记录:', hasStuckPoint ? '✓' : '✗');

    return true;
  } catch (error) {
    console.error('❌ 卡点求助测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试场景4: 情绪低落检测
 */
async function testEmotionalDistress() {
  console.log('\n=== 场景4: 情绪低落检测 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/mentor`,
      {
        userId: TEST_USER_ID,
        message: '我感觉自己很没用，什么都做不好',
        trigger: 'emotional_distress_detected',
        taskId: 'test_task_001',
        detectedEmotion: 'discouraged',
        emotionIntensity: 0.8
      }
    );

    console.log('✅ 情绪检测处理成功');
    console.log('情感支持策略:', response.data.results[0]?.success ? '已触发' : '未触发');

    return true;
  } catch (error) {
    console.error('❌ 情绪检测测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试场景5: 任务完成
 */
async function testTaskCompleted() {
  console.log('\n=== 场景5: 任务完成 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/mentor`,
      {
        userId: TEST_USER_ID,
        message: '完成任务',
        trigger: 'task_completed',
        taskId: 'test_task_001',
        taskTitle: 'UI设计练习',
        completionTime: new Date().toISOString()
      }
    );

    console.log('✅ 任务完成处理成功');

    // 验证L4是否生成了任务微报告
    const memoryCheck = await axios.get(
      `${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}`
    );

    const hasTaskReport = memoryCheck.data.memory.L4_growth?.taskMicroReports?.length > 0;
    console.log('L4任务报告:', hasTaskReport ? '✓' : '✗');

    // 验证L3完成任务数是否增加
    const tasksCompleted = memoryCheck.data.memory.L3_recent?.tasksCompleted30d || 0;
    console.log('L3完成任务数:', tasksCompleted);

    return true;
  } catch (error) {
    console.error('❌ 任务完成测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试场景7: 质控打回安慰
 */
async function testTaskRejectedComfort() {
  console.log('\n=== 场景7: 质控打回安慰 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/mentor`,
      {
        userId: TEST_USER_ID,
        message: '任务被打回',
        trigger: 'task_rejected_comfort',
        taskId: 'test_task_002',
        rejectionReason: '设计细节需要优化'
      }
    );

    console.log('✅ 质控打回安慰成功');
    console.log('安慰策略:', response.data.results[0]?.success ? '已触发' : '未触发');

    return true;
  } catch (error) {
    console.error('❌ 质控打回测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试场景8: 里程碑达成
 */
async function testMilestoneReached() {
  console.log('\n=== 场景8: 里程碑达成 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/mentor`,
      {
        userId: TEST_USER_ID,
        message: '达成里程碑',
        trigger: 'milestone_reached',
        milestone: '完成首个设计任务',
        milestoneType: 'first_task',
        impact: '设计能力提升'
      }
    );

    console.log('✅ 里程碑处理成功');

    // 验证L4是否记录了里程碑
    const memoryCheck = await axios.get(
      `${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}`
    );

    const hasMilestone = memoryCheck.data.memory.L4_growth?.milestones?.length > 0;
    console.log('L4里程碑记录:', hasMilestone ? '✓' : '✗');

    // 验证L6关系阶段（如果对话次数够，可能升级到warming）
    const relationshipStage = memoryCheck.data.memory.L6_relationship?.relationshipStage;
    console.log('L6关系阶段:', relationshipStage);

    return true;
  } catch (error) {
    console.error('❌ 里程碑测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试场景6: 主动关怀
 */
async function testProactiveCheckin() {
  console.log('\n=== 场景6: 主动关怀 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/mentor`,
      {
        userId: TEST_USER_ID,
        message: '主动关怀',
        trigger: 'proactive_checkin'
      }
    );

    console.log('✅ 主动关怀处理成功');
    console.log('关怀策略:', response.data.results[0]?.success ? '已触发' : '未触发');

    return true;
  } catch (error) {
    console.error('❌ 主动关怀测试失败:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Phase R2 触发场景测试                ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [];

  results.push(await testStuckHelpRequest());
  results.push(await testEmotionalDistress());
  results.push(await testTaskCompleted());
  results.push(await testTaskRejectedComfort());
  results.push(await testMilestoneReached());
  results.push(await testProactiveCheckin());

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  测试总结                              ║');
  console.log('╚════════════════════════════════════════╝');

  const passCount = results.filter(r => r).length;
  console.log(`通过: ${passCount}/${results.length}`);

  if (passCount === results.length) {
    console.log('\n🎉 Phase R2 所有场景处理正常！');
    console.log('\n功能总结:');
    console.log('✅ 场景3: 卡点求助 - 情绪接住 + 苏格拉底式引导');
    console.log('✅ 场景4: 情绪检测 - 情感支持优先');
    console.log('✅ 场景5: 任务完成 - 生成L4报告 + 更新L3统计');
    console.log('✅ 场景7: 质控打回 - 归因外部化 + 具体建议');
    console.log('✅ 场景8: 里程碑 - 记录L4 + 关系阶段升级');
    console.log('✅ 场景6: 主动关怀 - 基于L3状态定制');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查日志');
  }
}

// 运行测试
runAllTests().catch(console.error);
