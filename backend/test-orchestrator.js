/**
 * Phase R1测试脚本
 * 测试编排器和6层记忆系统
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3517';

// 测试用户ID（从数据库中存在的用户）
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testMemorySystem() {
  console.log('\n=== 测试1: 查看6层记忆 ===');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}`
    );

    console.log('✅ 记忆查询成功');
    console.log('L5核心画像:', response.data.memory.L5_core ? '✓' : '✗');
    console.log('L6关系记忆:', response.data.memory.L6_relationship ? '✓' : '✗');
    console.log('L4成长档案:', response.data.memory.L4_growth ? '✓' : '✗');
    console.log('L3近期摘要:', response.data.memory.L3_recent ? '✓' : '✗');

    if (response.data.memory.L5_core) {
      console.log('\n学生画像:');
      console.log(`- 昵称: ${response.data.memory.L5_core.nickname}`);
      console.log(`- 等级: Lv.${response.data.memory.L5_core.level}`);
      console.log(`- 赛道: ${response.data.memory.L5_core.track || '未确定'}`);
    }

    if (response.data.memory.L6_relationship) {
      console.log('\n关系状态:');
      console.log(`- 关系阶段: ${response.data.memory.L6_relationship.relationshipStage}`);
      console.log(`- 对话次数: ${response.data.memory.L6_relationship.totalConversations}`);
    }

    return true;
  } catch (error) {
    console.error('❌ 记忆查询失败:', error.response?.data || error.message);
    return false;
  }
}

async function testMentorDialogue() {
  console.log('\n=== 测试2: 导师对话（增强版） ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/mentor`,
      {
        userId: TEST_USER_ID,
        message: '我在做这个项目的时候遇到困难了',
        trigger: 'STUCK_HELP_REQUEST'
      }
    );

    console.log('✅ 导师对话成功');
    console.log('调用结果:', response.data.results[0]);

    if (response.data.results[0]?.success) {
      console.log('\n导师回复已生成');
      if (response.data.results[0].data?.memory) {
        console.log('记忆系统已加载');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 导师对话失败:', error.response?.data || error.message);
    return false;
  }
}

async function testTaskAccepted() {
  console.log('\n=== 测试3: 任务接取触发 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/task-accepted`,
      {
        userId: TEST_USER_ID,
        taskId: 'task_test_001'
      }
    );

    console.log('✅ 任务接取触发成功');
    console.log('调用结果:', response.data.results[0]);

    return true;
  } catch (error) {
    console.error('❌ 任务接取触发失败:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateMemory() {
  console.log('\n=== 测试4: 更新记忆 ===');

  try {
    // 更新L5核心画像
    await axios.post(
      `${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}/core-profile`,
      {
        track: '设计师',
        abilityTags: ['UI设计', '交互设计']
      }
    );
    console.log('✅ L5核心画像更新成功');

    // 添加L6关系记忆
    await axios.post(
      `${BASE_URL}/api/v1/orchestrator/memory/${TEST_USER_ID}/relationship`,
      {
        type: 'quote',
        data: {
          quote: '我想成为一个优秀的设计师',
          context: '测试对话'
        }
      }
    );
    console.log('✅ L6关系记忆添加成功');

    return true;
  } catch (error) {
    console.error('❌ 记忆更新失败:', error.response?.data || error.message);
    return false;
  }
}

async function testEventStats() {
  console.log('\n=== 测试5: 事件统计 ===');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/orchestrator/stats/${TEST_USER_ID}`
    );

    console.log('✅ 事件统计查询成功');
    console.log('统计数据:', response.data.stats);

    return true;
  } catch (error) {
    console.error('❌ 事件统计查询失败:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Phase R1 编排器功能测试              ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [];

  results.push(await testMemorySystem());
  results.push(await testMentorDialogue());
  results.push(await testTaskAccepted());
  results.push(await testUpdateMemory());
  results.push(await testEventStats());

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  测试总结                              ║');
  console.log('╚════════════════════════════════════════╝');

  const passCount = results.filter(r => r).length;
  console.log(`通过: ${passCount}/${results.length}`);

  if (passCount === results.length) {
    console.log('\n🎉 Phase R1 所有功能正常！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查日志');
  }
}

// 运行测试
runAllTests().catch(console.error);
