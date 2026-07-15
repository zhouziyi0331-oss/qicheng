/**
 * Phase R4 测试脚本
 * 测试报告生成Agent功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3517/api/v1';

// 测试用户ID（Phase R2中已添加成长数据）
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

console.log('╔════════════════════════════════════════╗');
console.log('║  Phase R4 报告生成Agent测试           ║');
console.log('╚════════════════════════════════════════╝\n');

async function testReportGeneration() {
  try {
    console.log('📊 测试场景：生成学生能力综合报告\n');
    console.log(`用户ID: ${TEST_USER_ID}`);
    console.log('报告类型: comprehensive');
    console.log('时间范围: 90天\n');

    const response = await axios.post(`${BASE_URL}/orchestrator/test/report-generation`, {
      userId: TEST_USER_ID,
      reportType: 'comprehensive',
      timeRange: 90
    });

    if (response.data.success && response.data.results.length > 0) {
      const result = response.data.results[0];

      if (result.success) {
        console.log('✅ 报告生成成功\n');

        const report = result.data.report;
        const summary = result.data.summary;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 报告摘要');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`报告ID: ${report.reportId}`);
        console.log(`学生ID: ${report.studentId}`);
        console.log(`生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}`);
        console.log(`\n总任务数: ${summary.totalTasks}`);
        console.log(`完成率: ${summary.completionRate.toFixed(1)}%`);
        console.log(`成长趋势: ${summary.growthTrend}`);
        console.log(`里程碑数: ${summary.milestonesCount}`);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💪 技能画像');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (report.skillProfile.strengths.length > 0) {
          console.log('\n优势技能:');
          report.skillProfile.strengths.forEach((skill, idx) => {
            console.log(`  ${idx + 1}. ${skill}`);
          });
        } else {
          console.log('\n优势技能: (暂无数据)');
        }

        if (report.skillProfile.weaknesses.length > 0) {
          console.log('\n待提升领域:');
          report.skillProfile.weaknesses.forEach((area, idx) => {
            console.log(`  ${idx + 1}. ${area}`);
          });
        } else {
          console.log('\n待提升领域: (暂无数据)');
        }

        if (report.skillProfile.recommendations.length > 0) {
          console.log('\n发展建议:');
          report.skillProfile.recommendations.forEach((rec, idx) => {
            console.log(`  ${idx + 1}. ${rec}`);
          });
        } else {
          console.log('\n发展建议: (暂无数据)');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 里程碑记录');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (report.milestones && report.milestones.length > 0) {
          report.milestones.forEach((milestone, idx) => {
            console.log(`\n${idx + 1}. ${milestone.type || '未知类型'}`);
            console.log(`   时间: ${milestone.date || milestone.createdAt}`);
            console.log(`   描述: ${milestone.description || milestone.details || '无描述'}`);
            console.log(`   影响: ${milestone.impact || '未记录'}`);
          });
        } else {
          console.log('\n暂无里程碑记录');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔮 导师洞察');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(report.mentorInsights || '(AI分析数据不足)');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📌 下一步行动建议');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (report.nextSteps && report.nextSteps.length > 0) {
          report.nextSteps.forEach((step, idx) => {
            console.log(`${idx + 1}. ${step}`);
          });
        } else {
          console.log('(暂无建议)');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏱️  性能指标');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`处理时间: ${result.duration}ms`);
        console.log(`Agent名称: ${result.agentName}`);

        return true;
      } else {
        console.log('❌ 报告生成失败');
        console.log('错误信息:', result.error);
        return false;
      }
    } else {
      console.log('❌ API调用失败');
      console.log('响应:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 测试失败');
    console.error('错误:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('开始测试...\n');

  const passed = await testReportGeneration();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('测试结果');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`通过: ${passed ? '1/1' : '0/1'}`);

  if (passed) {
    console.log('\n🎉 Phase R4 报告生成Agent测试通过！');
  } else {
    console.log('\n⚠️  Phase R4 报告生成Agent测试失败');
  }

  process.exit(passed ? 0 : 1);
}

runTests();
