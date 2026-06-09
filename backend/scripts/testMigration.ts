#!/usr/bin/env ts-node
/**
 * 功能测试脚本 - 验证迁移后的功能
 * 运行: npx ts-node scripts/testMigration.ts
 */

import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  log(passed ? '✅' : '❌', `${name}: ${message}`);
}

// 测试1: 学生注册流程
async function testStudentRegistration() {
  log('📝', '测试1: 学生注册流程');

  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      phone: '13800138000',
      code: '123456',
      userType: 'student',
      nickname: '测试学生',
    });

    if (response.data.success) {
      addResult('学生注册', true, '注册成功，应该初始化 track=content, current_level=0');
    } else {
      addResult('学生注册', false, '注册失败');
    }
  } catch (error: any) {
    addResult('学生注册', false, error.message);
  }
}

// 测试2: 学生档案查询
async function testStudentProfile(token: string) {
  log('📝', '测试2: 学生档案查询');

  try {
    const response = await axios.get(`${API_BASE}/student/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const profile = response.data.data;

    if (profile.track && profile.current_level !== undefined) {
      addResult('学生档案', true, `track=${profile.track}, level=${profile.current_level}`);
    } else {
      addResult('学生档案', false, '缺少 track 或 current_level 字段');
    }
  } catch (error: any) {
    addResult('学生档案', false, error.message);
  }
}

// 测试3: 任务列表等级过滤
async function testTaskFiltering(token: string) {
  log('📝', '测试3: 任务列表等级过滤');

  try {
    const response = await axios.get(`${API_BASE}/tasks/matched`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tasks = response.data.data;

    if (Array.isArray(tasks)) {
      // 检查是否有 studentLevel 和 allowedDifficulties 字段
      if (response.data.studentLevel !== undefined) {
        addResult('等级过滤', true, `学生等级=${response.data.studentLevel}, 允许难度=${response.data.allowedDifficulties}`);
      } else {
        addResult('等级过滤', false, '响应中缺少 studentLevel 字段');
      }
    } else {
      addResult('等级过滤', false, '任务列表格式错误');
    }
  } catch (error: any) {
    addResult('等级过滤', false, error.message);
  }
}

// 测试4: 跳级资格检查
async function testJumpEligibility(token: string) {
  log('📝', '测试4: 跳级资格检查');

  try {
    const response = await axios.get(`${API_BASE}/students/jump-eligibility`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data.data;

    if (data.eligible !== undefined && data.currentLevel !== undefined) {
      addResult('跳级资格', true, `eligible=${data.eligible}, currentLevel=${data.currentLevel}`);
    } else {
      addResult('跳级资格', false, '响应格式错误');
    }
  } catch (error: any) {
    addResult('跳级资格', false, error.message);
  }
}

// 测试5: 组队创建权限
async function testTeamCreation(token: string, level: number) {
  log('📝', '测试5: 组队创建权限');

  try {
    const response = await axios.post(
      `${API_BASE}/teams`,
      {
        name: '测试队伍',
        track: 'content',
        description: '测试描述',
        maxMembers: 5,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (level < 6) {
      // 应该返回403
      addResult('组队权限', false, `Lv.${level}学生不应该能创建队伍，但成功了`);
    } else {
      addResult('组队权限', true, `Lv.${level}学生成功创建队伍`);
    }
  } catch (error: any) {
    if (level < 6 && error.response?.status === 403) {
      addResult('组队权限', true, `Lv.${level}学生正确被拒绝（403）`);
    } else {
      addResult('组队权限', false, error.message);
    }
  }
}

// 测试6: 数据库字段检查
async function testDatabaseFields() {
  log('📝', '测试6: 数据库字段检查（需要数据库访问）');

  // 这个测试需要直接数据库访问
  addResult('数据库字段', false, '需要数据库访问，请手动执行SQL验证');
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始功能测试...\n');
  console.log(`API Base: ${API_BASE}\n`);

  // 注意：这些测试需要实际的API服务运行
  log('⚠️', '注意：这些测试需要后端服务运行在 ' + API_BASE);
  log('⚠️', '如果服务未运行，测试将失败\n');

  // 测试1: 注册
  await testStudentRegistration();

  // 其他测试需要token，这里只是示例
  // 实际使用时需要先登录获取token

  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.message}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`通过: ${passed}/${total} (${Math.round(passed / total * 100)}%)`);

  if (passed === total) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查');
  }
}

// 手动测试指南
function printManualTestGuide() {
  console.log('\n📋 手动测试指南\n');
  console.log('由于需要实际的用户token和数据库访问，建议手动测试以下功能：\n');

  console.log('1️⃣  学生注册流程');
  console.log('   - 注册新学生');
  console.log('   - 检查是否初始化 track=content, current_level=0');
  console.log('   - 检查是否创建 student_capabilities 记录\n');

  console.log('2️⃣  等级过滤功能');
  console.log('   - Lv.0学生登录');
  console.log('   - 查看任务列表');
  console.log('   - 验证只显示难度1的任务\n');

  console.log('3️⃣  跳级流程');
  console.log('   - 完成足够任务达到跳级条件');
  console.log('   - 检查跳级资格');
  console.log('   - 申请跳级测试');
  console.log('   - 提交交付物（AI评分）\n');

  console.log('4️⃣  组队系统');
  console.log('   - Lv.5学生尝试创建队伍（应该失败）');
  console.log('   - Lv.6学生创建队伍（应该成功）');
  console.log('   - Lv.5学生申请加入（应该成功）\n');

  console.log('5️⃣  数据库验证');
  console.log('   - 运行 SQL 验证查询');
  console.log('   - 检查数据完整性');
  console.log('   - 验证索引创建\n');
}

// 执行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--guide')) {
    printManualTestGuide();
  } else {
    runTests().catch(error => {
      console.error('💥 测试失败:', error);
      process.exit(1);
    });
  }
}

export { runTests, printManualTestGuide };
