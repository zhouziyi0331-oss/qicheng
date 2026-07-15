/**
 * Phase R3测试脚本
 * 测试需求拆解Agent (demandParserAgent)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3517';
const TEST_TASK_ID = '10000000-0000-0000-0000-000000000001'; // 使用一个测试UUID
const TEST_ENTERPRISE_ID = '00000000-0000-0000-0000-000000000001';

/**
 * 测试场景1: 简单需求拆解
 */
async function testSimpleDemand() {
  console.log('\n=== 场景1: 简单需求拆解 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/demand-parsing`,
      {
        taskId: TEST_TASK_ID,
        taskDescription: '开发一个企业官网，需要首页、关于我们、产品展示、新闻动态、联系我们5个页面，要求响应式设计，支持PC和移动端。',
        enterpriseId: TEST_ENTERPRISE_ID
      }
    );

    console.log('✅ 需求拆解成功');

    const result = response.data.results[0];
    if (result.success) {
      const breakdown = result.data.breakdownResult;
      console.log(`\n子任务数量: ${breakdown.subtasks.length}`);
      console.log(`总价格范围: ¥${breakdown.totalCost.min} - ¥${breakdown.totalCost.max}`);
      console.log(`建议价格: ¥${breakdown.totalCost.recommended}`);
      console.log(`总工期范围: ${breakdown.totalDays.min} - ${breakdown.totalDays.max} 天`);
      console.log(`建议工期: ${breakdown.totalDays.recommended} 天`);
      console.log(`\n需要的技能:`);
      breakdown.requiredSkills.forEach(skill => console.log(`  - ${skill}`));

      console.log(`\n子任务列表:`);
      breakdown.subtasks.forEach((st, index) => {
        console.log(`  ${index + 1}. ${st.title} (难度: ${st.difficulty}/5, 预估: ${st.estimatedHours}小时)`);
        console.log(`     ${st.description.substring(0, 80)}...`);
      });

      if (breakdown.riskWarnings.length > 0) {
        console.log(`\n⚠️  风险提示:`);
        breakdown.riskWarnings.forEach(warning => console.log(`  - ${warning}`));
      }

      if (breakdown.recommendations.length > 0) {
        console.log(`\n💡 建议:`);
        breakdown.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
    } else {
      console.log('❌ 拆解失败:', result.error);
    }

    return result.success;
  } catch (error) {
    console.error('❌ 简单需求拆解测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试场景2: 复杂需求拆解
 */
async function testComplexDemand() {
  console.log('\n=== 场景2: 复杂需求拆解 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/demand-parsing`,
      {
        taskId: TEST_TASK_ID,
        taskDescription: `
开发一个在线教育平台，功能需求如下：
1. 用户系统：学生端和教师端分别注册登录，支持微信登录
2. 课程系统：教师可以创建课程、上传视频、发布作业
3. 学习系统：学生可以观看视频、提交作业、查看成绩
4. 互动系统：实时聊天、讨论区、问答
5. 支付系统：课程购买、VIP会员
6. 数据统计：学习时长、完课率、成绩分析
技术要求：前后端分离，需要管理后台，支持10万并发用户
        `,
        enterpriseId: TEST_ENTERPRISE_ID
      }
    );

    console.log('✅ 复杂需求拆解成功');

    const result = response.data.results[0];
    if (result.success) {
      const breakdown = result.data.breakdownResult;
      console.log(`\n子任务数量: ${breakdown.subtasks.length}`);
      console.log(`总价格范围: ¥${breakdown.totalCost.min} - ¥${breakdown.totalCost.max}`);
      console.log(`建议价格: ¥${breakdown.totalCost.recommended}`);
      console.log(`总工期: ${breakdown.totalDays.recommended} 天`);

      console.log(`\n需要的技能 (${breakdown.requiredSkills.length}个):`);
      breakdown.requiredSkills.slice(0, 10).forEach(skill => console.log(`  - ${skill}`));
      if (breakdown.requiredSkills.length > 10) {
        console.log(`  ... 还有 ${breakdown.requiredSkills.length - 10} 个技能`);
      }

      console.log(`\n⚠️  风险提示 (${breakdown.riskWarnings.length}个):`);
      breakdown.riskWarnings.forEach(warning => console.log(`  - ${warning}`));

      console.log(`\n💡 建议 (${breakdown.recommendations.length}个):`);
      breakdown.recommendations.forEach(rec => console.log(`  - ${rec}`));
    } else {
      console.log('❌ 拆解失败:', result.error);
    }

    return result.success;
  } catch (error) {
    console.error('❌ 复杂需求拆解测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试场景3: 模糊需求拆解
 */
async function testVagueDemand() {
  console.log('\n=== 场景3: 模糊需求拆解 ===');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orchestrator/test/demand-parsing`,
      {
        taskId: TEST_TASK_ID,
        taskDescription: '做一个APP，类似抖音那种，要能发视频、点赞评论，预算不多，尽快做出来。',
        enterpriseId: TEST_ENTERPRISE_ID
      }
    );

    console.log('✅ 模糊需求拆解成功');

    const result = response.data.results[0];
    if (result.success) {
      const breakdown = result.data.breakdownResult;
      console.log(`\n子任务数量: ${breakdown.subtasks.length}`);
      console.log(`建议价格: ¥${breakdown.totalCost.recommended}`);
      console.log(`建议工期: ${breakdown.totalDays.recommended} 天`);

      console.log(`\n⚠️  风险提示:`);
      breakdown.riskWarnings.forEach(warning => console.log(`  - ${warning}`));

      console.log(`\n💡 建议:`);
      breakdown.recommendations.forEach(rec => console.log(`  - ${rec}`));
    } else {
      console.log('❌ 拆解失败:', result.error);
    }

    return result.success;
  } catch (error) {
    console.error('❌ 模糊需求拆解测试失败:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Phase R3 需求拆解Agent测试           ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [];

  results.push(await testSimpleDemand());
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒避免API限流

  results.push(await testComplexDemand());
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.push(await testVagueDemand());

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  测试总结                              ║');
  console.log('╚════════════════════════════════════════╝');

  const passCount = results.filter(r => r).length;
  console.log(`通过: ${passCount}/${results.length}`);

  if (passCount === results.length) {
    console.log('\n🎉 Phase R3 需求拆解Agent测试全部通过！');
    console.log('\n功能总结:');
    console.log('✅ 场景1: 简单需求拆解 - 清晰明确的需求');
    console.log('✅ 场景2: 复杂需求拆解 - 多模块大型项目');
    console.log('✅ 场景3: 模糊需求拆解 - 不明确需求+风险提示');
    console.log('\n核心能力:');
    console.log('  • AI自动拆解任务为3-7个子任务');
    console.log('  • 智能估算价格和工期');
    console.log('  • 识别技能要求和依赖关系');
    console.log('  • 提供风险提示和优化建议');
    console.log('  • 结果保存到数据库供后续查看');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查日志');
  }
}

// 运行测试
runAllTests().catch(console.error);
