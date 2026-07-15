/**
 * 直接测试memoryService.updateGrowthArchive
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3517';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testDirectMemoryUpdate() {
  console.log('\n=== 直接测试记忆更新 ===\n');

  // 1. 查看当前L4状态
  const before = await axios.get(`${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}`);
  console.log('更新前 L4 milestones数量:', before.data.memory.L4_growth.milestones.length);

  // 2. 使用orchestrator测试路由调用handleMilestoneReached
  console.log('\n调用MILESTONE_REACHED触发器...');
  const result = await axios.post(`${BASE_URL}/api/v1/orchestrator/test/mentor`, {
    userId: TEST_USER_ID,
    message: '里程碑',
    trigger: 'milestone_reached',
    milestone: '直接测试里程碑' + Date.now(),
    milestoneType: 'test',
    impact: '测试'
  });

  console.log('触发器调用结果:', result.data.results[0].success ? '✓ 成功' : '✗ 失败');
  if (!result.data.results[0].success) {
    console.error('错误:', result.data.results[0].error);
  }

  // 3. 等待一下确保数据库操作完成
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. 再次查看L4状态
  const after = await axios.get(`${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}`);
  console.log('\n更新后 L4 milestones数量:', after.data.memory.L4_growth.milestones.length);

  if (after.data.memory.L4_growth.milestones.length > before.data.memory.L4_growth.milestones.length) {
    console.log('✅ L4里程碑成功添加！');
    console.log('最新里程碑:', after.data.memory.L4_growth.milestones.slice(-1)[0]);
  } else {
    console.log('❌ L4里程碑未添加');
    console.log('\n分析可能的原因:');
    console.log('1. handleMilestoneReached未被调用');
    console.log('2. updateGrowthArchive执行但UPDATE未匹配到行');
    console.log('3. 数据库事务回滚');
  }

  // 5. 检查L6对话摘要是否有更新（这个是在handleMessage中更新的）
  const summariesBefore = before.data.memory.L6_relationship.conversationSummaries.length;
  const summariesAfter = after.data.memory.L6_relationship.conversationSummaries.length;

  console.log('\nL6对话摘要变化:', summariesBefore, '→', summariesAfter);
  if (summariesAfter > summariesBefore) {
    console.log('✅ handleMessage被调用了（L6有更新）');
  } else {
    console.log('❌ handleMessage可能未被调用');
  }
}

testDirectMemoryUpdate().catch(console.error);
