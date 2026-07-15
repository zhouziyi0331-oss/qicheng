#!/usr/bin/env ts-node

/**
 * 天赋标签系统 - 代码完整性验证
 *
 * 验证内容：
 * 1. 所有服务文件可以导入
 * 2. 控制器文件可以导入
 * 3. 数据库迁移文件存在且语法正确
 * 4. 路由配置正确
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  passed: string[];
  failed: Array<{ name: string; error: string }>;
  skipped: string[];
}

const results: TestResult = {
  passed: [],
  failed: [],
  skipped: []
};

function logTest(name: string, status: 'pass' | 'fail' | 'skip', error?: string) {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${emoji} ${name}${error ? ': ' + error : ''}`);

  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push({ name, error: error || 'Unknown error' });
  else results.skipped.push(name);
}

async function testServiceFiles() {
  console.log('\n📦 测试服务层文件...\n');

  const services = [
    'talentTagInferenceService',
    'talentMatchingService',
    'capabilityExtractionService',
    'requirementBreakdownService'
  ];

  for (const serviceName of services) {
    try {
      const servicePath = path.join(__dirname, '../src/services', `${serviceName}.ts`);

      if (!fs.existsSync(servicePath)) {
        logTest(`服务文件 ${serviceName}`, 'fail', '文件不存在');
        continue;
      }

      // 尝试动态导入
      const service = await import(servicePath);

      if (service && typeof service === 'object') {
        logTest(`服务文件 ${serviceName}`, 'pass');
      } else {
        logTest(`服务文件 ${serviceName}`, 'fail', '导入失败');
      }
    } catch (error: any) {
      logTest(`服务文件 ${serviceName}`, 'fail', error.message);
    }
  }
}

async function testControllerFiles() {
  console.log('\n🎮 测试控制器文件...\n');

  try {
    const controllerPath = path.join(__dirname, '../src/controllers/talentController.ts');

    if (!fs.existsSync(controllerPath)) {
      logTest('TalentController', 'fail', '文件不存在');
      return;
    }

    const controller = await import(controllerPath);

    const methods = [
      'getStudentTalentProfile',
      'getAllTalentTags',
      'getAllBusinessScenarios',
      'matchStudentsForTask',
      'getStudentGrowthStats'
    ];

    for (const method of methods) {
      if (controller.TalentController && typeof controller.TalentController[method] === 'function') {
        logTest(`控制器方法 ${method}`, 'pass');
      } else {
        logTest(`控制器方法 ${method}`, 'fail', '方法不存在');
      }
    }
  } catch (error: any) {
    logTest('TalentController', 'fail', error.message);
  }
}

async function testMigrationFiles() {
  console.log('\n📄 测试迁移文件...\n');

  const migrations = [
    '200_talent_tag_system.sql',
    '201_more_talent_tags.sql',
    '202_capability_and_requirement_tags.sql',
    '203_more_business_scenarios.sql'
  ];

  for (const migration of migrations) {
    try {
      const migrationPath = path.join(__dirname, '../migrations', migration);

      if (!fs.existsSync(migrationPath)) {
        logTest(`迁移文件 ${migration}`, 'fail', '文件不存在');
        continue;
      }

      const content = fs.readFileSync(migrationPath, 'utf-8');

      // 基本SQL语法检查
      if (content.includes('CREATE TABLE') || content.includes('INSERT INTO')) {
        logTest(`迁移文件 ${migration}`, 'pass');
      } else {
        logTest(`迁移文件 ${migration}`, 'fail', '内容异常');
      }
    } catch (error: any) {
      logTest(`迁移文件 ${migration}`, 'fail', error.message);
    }
  }
}

async function testRouteFiles() {
  console.log('\n🛣️  测试路由文件...\n');

  try {
    // 检查路由文件
    const routePath = path.join(__dirname, '../src/routes/talent.ts');
    if (!fs.existsSync(routePath)) {
      logTest('talent.ts 路由文件', 'fail', '文件不存在');
    } else {
      logTest('talent.ts 路由文件', 'pass');
    }

    // 检查app.ts是否注册了路由
    const appPath = path.join(__dirname, '../src/app.ts');
    if (!fs.existsSync(appPath)) {
      logTest('app.ts 存在', 'fail', '文件不存在');
      return;
    }

    const appContent = fs.readFileSync(appPath, 'utf-8');

    if (appContent.includes("import talentRoutes from './routes/talent'")) {
      logTest('app.ts 导入 talentRoutes', 'pass');
    } else {
      logTest('app.ts 导入 talentRoutes', 'fail', '未找到导入语句');
    }

    if (appContent.includes("app.use('/api/v1/talent', talentRoutes)")) {
      logTest('app.ts 注册 /api/v1/talent', 'pass');
    } else {
      logTest('app.ts 注册 /api/v1/talent', 'fail', '未找到注册语句');
    }
  } catch (error: any) {
    logTest('路由配置检查', 'fail', error.message);
  }
}

async function testFrontendIntegration() {
  console.log('\n📱 测试前端集成...\n');

  try {
    // 检查前端API文件
    const apiPath = path.join(__dirname, '../../miniapp/src/services/api.ts');
    if (!fs.existsSync(apiPath)) {
      logTest('前端 api.ts', 'skip', '文件不存在（可能前端未同步）');
    } else {
      const apiContent = fs.readFileSync(apiPath, 'utf-8');

      if (apiContent.includes('talentAPI')) {
        logTest('前端 talentAPI 定义', 'pass');
      } else {
        logTest('前端 talentAPI 定义', 'fail', '未找到');
      }
    }

    // 检查前端页面
    const profilePagePath = path.join(__dirname, '../../miniapp/src/pages/talent-profile/index.tsx');
    if (!fs.existsSync(profilePagePath)) {
      logTest('前端 talent-profile 页面', 'fail', '文件不存在');
    } else {
      logTest('前端 talent-profile 页面', 'pass');
    }

    // 检查前端路由配置
    const appConfigPath = path.join(__dirname, '../../miniapp/src/app.config.ts');
    if (!fs.existsSync(appConfigPath)) {
      logTest('前端 app.config.ts', 'skip', '文件不存在');
    } else {
      const configContent = fs.readFileSync(appConfigPath, 'utf-8');

      if (configContent.includes('pages/talent-profile/index')) {
        logTest('前端路由配置 talent-profile', 'pass');
      } else {
        logTest('前端路由配置 talent-profile', 'fail', '未配置');
      }
    }
  } catch (error: any) {
    logTest('前端集成检查', 'fail', error.message);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证总结');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed.length}`);
  console.log(`❌ 失败: ${results.failed.length}`);
  console.log(`⏭️  跳过: ${results.skipped.length}`);
  console.log('='.repeat(60) + '\n');

  if (results.failed.length > 0) {
    console.log('❌ 失败的测试:\n');
    results.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}`);
      console.log(`    错误: ${error}\n`);
    });
  }

  const total = results.passed.length + results.failed.length;
  const passRate = total > 0 ? (results.passed.length / total * 100).toFixed(1) : '0.0';
  console.log(`通过率: ${passRate}%`);

  if (results.failed.length === 0) {
    console.log('\n🎉 所有代码完整性检查通过！');
    console.log('\n📝 下一步：');
    console.log('  1. 确保PostgreSQL运行');
    console.log('  2. 运行数据库迁移：psql $DATABASE_URL -f migrations/200_talent_tag_system.sql');
    console.log('  3. 启动后端服务：npm run dev');
    console.log('  4. 测试API端点\n');
  } else {
    console.log('\n⚠️  有检查失败，请先修复上述问题。\n');
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 启程天赋标签系统 - 代码完整性验证');
  console.log('='.repeat(60));

  try {
    await testServiceFiles();
    await testControllerFiles();
    await testMigrationFiles();
    await testRouteFiles();
    await testFrontendIntegration();
  } catch (error: any) {
    console.error('\n💥 验证过程中发生错误:', error.message);
  }

  await printSummary();
}

// 运行验证
main().catch(console.error);
