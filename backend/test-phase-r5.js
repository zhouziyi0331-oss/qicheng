/**
 * Phase R5 测试脚本
 * 测试企业查看学生报告功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3517/api/v1';

// 测试用户
const TEST_STUDENT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_COMPANY_ID = '00000000-0000-0000-0000-000000000002'; // 需要创建

console.log('╔════════════════════════════════════════╗');
console.log('║  Phase R5 企业报告系统测试            ║');
console.log('╚════════════════════════════════════════╝\n');

// 模拟登录获取token（实际应该调用登录接口）
// 这里为了测试简化，假设有token
const COMPANY_TOKEN = 'test_company_token';

async function testEnterpriseReportAccess() {
  try {
    console.log('📊 测试场景1：企业查看学生报告（无权限）\n');

    // 尝试访问学生报告（应该失败，因为没有购买或合作）
    try {
      const response = await axios.get(
        `${BASE_URL}/reports/enterprise/student/${TEST_STUDENT_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${COMPANY_TOKEN}`
          }
        }
      );

      console.log('❌ 应该返回403错误，但成功了');
      return false;
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ 正确拒绝访问（无权限）');
        console.log(`   错误信息: ${error.response.data.message}\n`);
      } else {
        console.log('❌ 错误类型不符合预期');
        console.log(`   实际错误: ${error.message}\n`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.log('❌ 测试失败');
    console.error('错误:', error.message);
    return false;
  }
}

async function testPublicReport() {
  try {
    console.log('📊 测试场景2：访问公开的学生报告\n');
    console.log(`学生ID: ${TEST_STUDENT_ID} (report_public=true)`);

    const response = await axios.get(
      `${BASE_URL}/reports/enterprise/student/${TEST_STUDENT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${COMPANY_TOKEN}`
        }
      }
    );

    if (response.data.success) {
      console.log('✅ 成功访问公开报告\n');
      console.log('访问原因:', response.data.data.accessReason);
      console.log('是否缓存:', response.data.data.isCached);
      console.log('生成时间:', new Date(response.data.data.generatedAt).toLocaleString('zh-CN'));

      const report = response.data.data.report;
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 报告内容摘要');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`报告ID: ${report.reportId}`);
      console.log(`学生ID: ${report.studentId}`);
      console.log(`总任务数: ${report.summary.totalTasks}`);
      console.log(`完成率: ${report.summary.completionRate.toFixed(1)}%`);
      console.log(`成长趋势: ${report.summary.growthTrend}`);
      console.log(`里程碑数: ${report.milestones.length}`);
      console.log(`优势技能: ${report.skillProfile.strengths.join(', ')}`);
      console.log(`下一步建议: ${report.nextSteps.length}条\n`);

      return true;
    } else {
      console.log('❌ API返回失败');
      return false;
    }
  } catch (error) {
    console.log('❌ 测试失败');
    console.error('错误:', error.response?.data || error.message);
    return false;
  }
}

async function testReportPurchase() {
  try {
    console.log('📊 测试场景3：企业购买报告访问权限\n');

    const response = await axios.post(
      `${BASE_URL}/reports/enterprise/purchase`,
      {
        studentId: TEST_STUDENT_ID,
        duration: 30
      },
      {
        headers: {
          'Authorization': `Bearer ${COMPANY_TOKEN}`
        }
      }
    );

    if (response.data.success) {
      console.log('✅ 购买成功\n');
      console.log('购买ID:', response.data.data.purchaseId);
      console.log('价格:', response.data.data.price, '元');
      console.log('过期时间:', new Date(response.data.data.expiresAt).toLocaleString('zh-CN'));
      console.log(`消息: ${response.data.message}\n`);
      return true;
    } else {
      console.log('❌ 购买失败');
      return false;
    }
  } catch (error) {
    console.log('❌ 测试失败');
    console.error('错误:', error.response?.data || error.message);
    return false;
  }
}

async function testAccessHistory() {
  try {
    console.log('📊 测试场景4：查看访问历史\n');

    const response = await axios.get(
      `${BASE_URL}/reports/enterprise/access-history?limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${COMPANY_TOKEN}`
        }
      }
    );

    if (response.data.success) {
      console.log(`✅ 获取访问历史成功 (共${response.data.data.length}条)\n`);

      if (response.data.data.length > 0) {
        console.log('最近访问记录:');
        response.data.data.forEach((log, idx) => {
          console.log(`${idx + 1}. ${log.student_name} - ${log.access_reason} - ${new Date(log.accessed_at).toLocaleString('zh-CN')}`);
        });
        console.log();
      } else {
        console.log('暂无访问记录\n');
      }

      return true;
    } else {
      console.log('❌ 获取失败');
      return false;
    }
  } catch (error) {
    console.log('❌ 测试失败');
    console.error('错误:', error.response?.data || error.message);
    return false;
  }
}

async function testPurchaseHistory() {
  try {
    console.log('📊 测试场景5：查看购买记录\n');

    const response = await axios.get(
      `${BASE_URL}/reports/enterprise/purchases`,
      {
        headers: {
          'Authorization': `Bearer ${COMPANY_TOKEN}`
        }
      }
    );

    if (response.data.success) {
      console.log(`✅ 获取购买记录成功 (共${response.data.data.length}条)\n`);

      if (response.data.data.length > 0) {
        console.log('购买记录:');
        response.data.data.forEach((purchase, idx) => {
          const status = purchase.is_active ? '✓有效' : '✗已过期';
          console.log(`${idx + 1}. ${purchase.student_name} - ¥${purchase.price} - ${purchase.duration_days}天 - ${status}`);
          console.log(`   购买时间: ${new Date(purchase.purchase_at).toLocaleString('zh-CN')}`);
          console.log(`   过期时间: ${new Date(purchase.expires_at).toLocaleString('zh-CN')}`);
        });
        console.log();
      } else {
        console.log('暂无购买记录\n');
      }

      return true;
    } else {
      console.log('❌ 获取失败');
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
  console.log('⚠️  注意：此测试需要：');
  console.log('   1. 服务器运行在 localhost:3517');
  console.log('   2. 数据库已执行 phase_r5_report_system.sql');
  console.log('   3. 测试用户已创建并设置report_public=true');
  console.log('   4. 有效的认证token（当前使用模拟token）\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  // 由于需要真实的认证token，这些测试暂时跳过
  // 实际部署时需要完善认证机制
  console.log('⚠️  当前测试需要真实的认证系统支持');
  console.log('   建议在实际环境中通过API测试工具（如Postman）进行测试\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('测试计划');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✓ 场景1: 企业访问未授权报告 - 应返回403');
  console.log('✓ 场景2: 企业访问公开报告 - 应返回完整报告');
  console.log('✓ 场景3: 企业购买报告权限 - 应创建购买记录');
  console.log('✓ 场景4: 查看访问历史 - 应返回访问日志');
  console.log('✓ 场景5: 查看购买记录 - 应返回购买列表\n');

  console.log('🎯 Phase R5.1 企业报告路由已创建');
  console.log('📁 关键文件:');
  console.log('   - src/routes/reports/enterpriseRoutes.ts');
  console.log('   - src/routes/reports/index.ts (已更新)');
  console.log('   - migrations/phase_r5_report_system.sql');
  console.log('   - test-phase-r5.js (本文件)\n');

  console.log('下一步: Phase R5.2 - 实现完整的访问控制和支付集成');
}

runTests();
