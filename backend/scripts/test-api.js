/**
 * 自动化API测试脚本
 * 测试企业端和学生端的核心API功能
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// 测试账号
const COMPANY_ACCOUNT = {
  phone: '13800000001',
  password: 'test123456'
};

const STUDENT_ACCOUNT = {
  phone: '13800000002',
  password: 'test123456'
};

let companyToken = '';
let studentToken = '';
let taskId = 'f77b5998-194e-4959-b218-7dd90bfc7992';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

async function runTest(name, testFn) {
  testResults.total++;
  try {
    log(`\n🧪 测试: ${name}`, 'blue');
    await testFn();
    testResults.passed++;
    logSuccess(`通过: ${name}`);
    return true;
  } catch (error) {
    testResults.failed++;
    logError(`失败: ${name}`);
    logError(`错误: ${error.message}`);
    if (error.response) {
      logError(`响应: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 1. 测试健康检查
async function testHealthCheck() {
  const response = await axios.get(`${API_BASE_URL}/health`);
  if (response.data.status !== 'ok') {
    throw new Error('健康检查失败');
  }
  logInfo(`服务状态: ${response.data.status}`);
}

// 2. 测试企业登录
async function testCompanyLogin() {
  const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
    phone: COMPANY_ACCOUNT.phone,
    password: COMPANY_ACCOUNT.password
  });

  if (!response.data.token) {
    throw new Error('未返回token');
  }

  companyToken = response.data.token;
  logInfo(`企业Token: ${companyToken.substring(0, 20)}...`);
  logInfo(`用户角色: ${response.data.user.role}`);
}

// 3. 测试学生登录
async function testStudentLogin() {
  const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
    phone: STUDENT_ACCOUNT.phone,
    password: STUDENT_ACCOUNT.password
  });

  if (!response.data.token) {
    throw new Error('未返回token');
  }

  studentToken = response.data.token;
  logInfo(`学生Token: ${studentToken.substring(0, 20)}...`);
  logInfo(`用户角色: ${response.data.user.role}`);
}

// 4. 测试获取任务详情
async function testGetTaskDetail() {
  const response = await axios.get(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });

  if (!response.data.id) {
    throw new Error('未返回任务详情');
  }

  logInfo(`任务标题: ${response.data.title}`);
  logInfo(`任务状态: ${response.data.status}`);
}

// 5. 测试触发AI匹配
async function testTriggerMatching() {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/tasks/${taskId}/trigger-matching`,
    {},
    { headers: { Authorization: `Bearer ${companyToken}` } }
  );

  if (!response.data.success) {
    throw new Error('匹配触发失败');
  }

  logInfo(`匹配学生数: ${response.data.matchedCount || 0}`);
  logInfo(`匹配消息: ${response.data.message}`);
}

// 6. 测试获取匹配的学生
async function testGetMatchedStudents() {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/tasks/${taskId}/matched-students`,
    { headers: { Authorization: `Bearer ${companyToken}` } }
  );

  if (!Array.isArray(response.data.students)) {
    throw new Error('未返回学生列表');
  }

  logInfo(`匹配学生数: ${response.data.students.length}`);

  if (response.data.students.length > 0) {
    const topStudent = response.data.students[0];
    logInfo(`Top学生匹配度: ${(topStudent.overallScore * 100).toFixed(1)}%`);
    logInfo(`技能匹配: ${(topStudent.skillMatchScore * 100).toFixed(1)}%`);
  }
}

// 7. 测试推送任务给学生
async function testPushToStudents() {
  // 先获取匹配的学生
  const matchResponse = await axios.get(
    `${API_BASE_URL}/api/v1/tasks/${taskId}/matched-students`,
    { headers: { Authorization: `Bearer ${companyToken}` } }
  );

  if (matchResponse.data.students.length === 0) {
    logWarning('没有匹配的学生，跳过推送测试');
    testResults.skipped++;
    return;
  }

  // 选择前3个学生
  const studentIds = matchResponse.data.students
    .slice(0, 3)
    .map(s => s.studentId);

  const response = await axios.post(
    `${API_BASE_URL}/api/v1/tasks/${taskId}/push-to-students`,
    { studentIds },
    { headers: { Authorization: `Bearer ${companyToken}` } }
  );

  if (!response.data.success) {
    throw new Error('推送失败');
  }

  logInfo(`推送学生数: ${studentIds.length}`);
  logInfo(`推送结果: ${response.data.message}`);
}

// 8. 测试学生获取推荐任务
async function testGetRecommendedTasks() {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/students/recommended-tasks`,
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );

  if (!Array.isArray(response.data.tasks)) {
    throw new Error('未返回任务列表');
  }

  logInfo(`推荐任务数: ${response.data.tasks.length}`);

  if (response.data.tasks.length > 0) {
    const task = response.data.tasks[0];
    logInfo(`任务标题: ${task.title}`);
    logInfo(`匹配度: ${(task.matchScore * 100).toFixed(1)}%`);
  }
}

// 9. 测试获取任务翻译
async function testGetTaskTranslation() {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/tasks/${taskId}/translation`,
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );

  if (!response.data.studentFriendlyTitle) {
    throw new Error('未返回任务翻译');
  }

  logInfo(`学生友好标题: ${response.data.studentFriendlyTitle}`);
  logInfo(`功能模块数: ${response.data.functionalModules?.length || 0}`);
  logInfo(`难度评分: ${response.data.difficultyOverall}/10`);
}

// 10. 测试获取工具提示
async function testGetToolHints() {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/mentor/tool-hints`,
    { headers: { Authorization: `Bearer ${studentToken}` } }
  );

  if (!Array.isArray(response.data.hints)) {
    throw new Error('未返回工具提示列表');
  }

  logInfo(`工具提示数: ${response.data.hints.length}`);
}

// 主测试流程
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚀 启程平台 - 自动化API测试', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  // 基础测试
  await runTest('1. 健康检查', testHealthCheck);

  // 认证测试
  await runTest('2. 企业登录', testCompanyLogin);
  await runTest('3. 学生登录', testStudentLogin);

  // 企业端测试
  log('\n' + '-'.repeat(60), 'yellow');
  log('📊 企业端API测试', 'yellow');
  log('-'.repeat(60), 'yellow');

  await runTest('4. 获取任务详情', testGetTaskDetail);
  await runTest('5. 触发AI匹配', testTriggerMatching);

  // 等待匹配完成
  logInfo('等待3秒让匹配完成...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  await runTest('6. 获取匹配的学生', testGetMatchedStudents);
  await runTest('7. 推送任务给学生', testPushToStudents);

  // 学生端测试
  log('\n' + '-'.repeat(60), 'yellow');
  log('👨‍🎓 学生端API测试', 'yellow');
  log('-'.repeat(60), 'yellow');

  await runTest('8. 获取推荐任务', testGetRecommendedTasks);
  await runTest('9. 获取任务翻译', testGetTaskTranslation);
  await runTest('10. 获取工具提示', testGetToolHints);

  // 测试结果汇总
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 测试结果汇总', 'cyan');
  log('='.repeat(60), 'cyan');

  log(`\n总测试数: ${testResults.total}`);
  logSuccess(`通过: ${testResults.passed}`);
  logError(`失败: ${testResults.failed}`);
  if (testResults.skipped > 0) {
    logWarning(`跳过: ${testResults.skipped}`);
  }

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\n通过率: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (testResults.failed === 0) {
    log('\n🎉 所有测试通过！系统运行正常！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查错误信息', 'red');
  }

  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

// 运行测试
runAllTests().catch(error => {
  logError(`测试执行失败: ${error.message}`);
  process.exit(1);
});
