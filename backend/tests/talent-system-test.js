#!/usr/bin/env node

/**
 * 天赋标签系统 - 核心功能测试脚本
 *
 * 测试内容：
 * 1. API端点可访问性
 * 2. 数据库表是否存在
 * 3. 服务层方法是否可调用
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试结果记录
const results = {
  passed: [],
  failed: [],
  skipped: []
};

function logTest(name, status, message = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${emoji} ${name}${message ? ': ' + message : ''}`);

  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push(name);
  else results.skipped.push(name);
}

async function testDatabaseTables() {
  console.log('\n📊 测试数据库表结构...\n');

  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'qicheng_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  const tables = [
    'talent_tags',
    'student_talent_tags',
    'business_scenario_tags',
    'student_tool_usage',
    'student_case_experience',
    'student_domain_understanding',
    'task_requirement_breakdown',
    'tag_extraction_rules'
  ];

  try {
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [table]
      );

      if (result.rows[0].exists) {
        logTest(`表 ${table} 存在`, 'pass');
      } else {
        logTest(`表 ${table} 存在`, 'fail', '表不存在');
      }
    }

    // 检查天赋标签数量
    const tagCountResult = await pool.query('SELECT COUNT(*) FROM talent_tags');
    const tagCount = parseInt(tagCountResult.rows[0].count);

    if (tagCount >= 54) {
      logTest(`天赋标签数量 (${tagCount}个)`, 'pass');
    } else {
      logTest(`天赋标签数量`, 'fail', `只有${tagCount}个，应该至少54个`);
    }

    // 检查业务场景标签数量
    const scenarioCountResult = await pool.query('SELECT COUNT(*) FROM business_scenario_tags');
    const scenarioCount = parseInt(scenarioCountResult.rows[0].count);

    if (scenarioCount >= 86) {
      logTest(`业务场景标签数量 (${scenarioCount}个)`, 'pass');
    } else {
      logTest(`业务场景标签数量`, 'fail', `只有${scenarioCount}个，应该至少86个`);
    }

    await pool.end();
  } catch (error) {
    logTest('数据库连接', 'fail', error.message);
    await pool.end();
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 测试API端点...\n');

  const endpoints = [
    { method: 'GET', path: '/talent/tags', name: '获取天赋标签列表' },
    { method: 'GET', path: '/talent/scenarios', name: '获取业务场景标签' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        timeout: 5000,
        validateStatus: () => true // 接受所有状态码
      });

      if (response.status === 200 && response.data.success) {
        logTest(endpoint.name, 'pass');
      } else if (response.status === 401) {
        logTest(endpoint.name, 'skip', '需要认证（正常）');
      } else {
        logTest(endpoint.name, 'fail', `状态码: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logTest(endpoint.name, 'skip', '服务器未启动');
      } else {
        logTest(endpoint.name, 'fail', error.message);
      }
    }
  }
}

async function testServiceFiles() {
  console.log('\n📦 测试服务层文件...\n');

  const services = [
    '../src/services/talentTagInferenceService',
    '../src/services/talentMatchingService',
    '../src/services/capabilityExtractionService',
    '../src/services/requirementBreakdownService'
  ];

  for (const servicePath of services) {
    try {
      const service = require(servicePath);
      const serviceName = servicePath.split('/').pop();

      if (service && typeof service === 'object') {
        logTest(`服务文件 ${serviceName}`, 'pass');
      } else {
        logTest(`服务文件 ${serviceName}`, 'fail', '导入失败');
      }
    } catch (error) {
      const serviceName = servicePath.split('/').pop();
      logTest(`服务文件 ${serviceName}`, 'fail', error.message);
    }
  }
}

async function testControllerFiles() {
  console.log('\n🎮 测试控制器文件...\n');

  try {
    const controller = require('../src/controllers/talentController');

    const methods = [
      'getStudentTalentProfile',
      'getAllTalentTags',
      'getAllBusinessScenarios',
      'matchStudentsForTask',
      'getStudentGrowthStats'
    ];

    for (const method of methods) {
      if (typeof controller.TalentController[method] === 'function') {
        logTest(`控制器方法 ${method}`, 'pass');
      } else {
        logTest(`控制器方法 ${method}`, 'fail', '方法不存在');
      }
    }
  } catch (error) {
    logTest('TalentController', 'fail', error.message);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);
  console.log(`⏭️  跳过: ${results.skipped.length}`);
  console.log('='.repeat(60) + '\n');

  if (results.failed.length > 0) {
    console.log('❌ 失败的测试:');
    results.failed.forEach(test => console.log(`  - ${test}`));
    console.log('');
  }

  const passRate = (results.passed.length / (results.passed.length + results.failed.length) * 100).toFixed(1);
  console.log(`通过率: ${passRate}%`);

  if (results.failed.length === 0) {
    console.log('\n🎉 所有测试通过！系统可以使用。\n');
  } else {
    console.log('\n⚠️  有测试失败，请检查上述问题。\n');
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 启程天赋标签系统 - 功能测试');
  console.log('='.repeat(60));

  try {
    await testServiceFiles();
    await testControllerFiles();
    await testDatabaseTables();
    await testAPIEndpoints();
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
  }

  await printSummary();
}

// 运行测试
main().catch(console.error);
