#!/usr/bin/env node
/**
 * 启程平台AI系统诊断工具
 * 检查哪些功能是真实的，哪些是空壳
 */

import { pool } from '../src/utils/db';
import * as fs from 'fs';
import * as path from 'path';

interface DiagnosticResult {
  category: string;
  item: string;
  status: 'real' | 'fake' | 'partial';
  evidence: string;
  priority: 'P0' | 'P1' | 'P2';
}

const results: DiagnosticResult[] = [];

async function checkDatabase() {
  console.log('\n🔍 检查数据库实际数据...\n');

  // 1. 检查OPC测试数据
  const opcResults = await pool.query(`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT personality_tag) as unique_tags
    FROM user_opc_results
  `);

  if (opcResults.rows[0].count > 0) {
    results.push({
      category: 'OPC测评',
      item: '用户测评数据',
      status: 'real',
      evidence: `${opcResults.rows[0].count}条真实测评记录，${opcResults.rows[0].unique_tags}种人格标签`,
      priority: 'P0'
    });
  } else {
    results.push({
      category: 'OPC测评',
      item: '用户测评数据',
      status: 'fake',
      evidence: '数据库中没有任何真实测评记录',
      priority: 'P0'
    });
  }

  // 2. 检查学生能力数据
  const studentCap = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN combined_vector IS NOT NULL THEN 1 END) as has_vector,
           COUNT(CASE WHEN profile_summary IS NOT NULL THEN 1 END) as has_summary
    FROM student_capabilities
  `);

  if (studentCap.rows[0].has_vector > 0) {
    results.push({
      category: '学生能力画像',
      item: 'AI生成的能力向量',
      status: 'real',
      evidence: `${studentCap.rows[0].has_vector}/${studentCap.rows[0].total}个学生有AI生成的向量`,
      priority: 'P0'
    });
  } else {
    results.push({
      category: '学生能力画像',
      item: 'AI生成的能力向量',
      status: 'fake',
      evidence: '没有学生生成过AI能力向量',
      priority: 'P0'
    });
  }

  // 3. 检查任务匹配数据
  const taskMatches = await pool.query(`
    SELECT COUNT(*) as count,
           AVG(overall_score) as avg_score,
           COUNT(CASE WHEN is_pushed = true THEN 1 END) as pushed_count
    FROM task_student_matches
  `);

  if (taskMatches.rows[0].count > 0) {
    results.push({
      category: '任务匹配',
      item: 'AI匹配记录',
      status: 'real',
      evidence: `${taskMatches.rows[0].count}条匹配记录，平均分${(taskMatches.rows[0].avg_score * 100).toFixed(1)}%，推送${taskMatches.rows[0].pushed_count}次`,
      priority: 'P0'
    });
  } else {
    results.push({
      category: '任务匹配',
      item: 'AI匹配记录',
      status: 'fake',
      evidence: '从未执行过AI匹配',
      priority: 'P0'
    });
  }

  // 4. 检查任务翻译数据
  const taskTranslations = await pool.query(`
    SELECT COUNT(*) as count
    FROM task_translations
  `);

  if (taskTranslations.rows[0].count > 0) {
    results.push({
      category: '启程老师翻译',
      item: '任务翻译记录',
      status: 'real',
      evidence: `${taskTranslations.rows[0].count}个任务有AI翻译`,
      priority: 'P1'
    });
  } else {
    results.push({
      category: '启程老师翻译',
      item: '任务翻译记录',
      status: 'fake',
      evidence: '没有任务被AI翻译过',
      priority: 'P1'
    });
  }

  // 5. 检查人格标签分布
  const personalityDist = await pool.query(`
    SELECT personality_tag, COUNT(*) as count
    FROM user_opc_results
    GROUP BY personality_tag
  `);

  if (personalityDist.rows.length > 0) {
    const distribution = personalityDist.rows.map(r => `${r.personality_tag}:${r.count}人`).join(', ');
    results.push({
      category: 'OPC测评',
      item: '人格标签分布',
      status: 'real',
      evidence: distribution,
      priority: 'P1'
    });
  }
}

async function checkFrontendCode() {
  console.log('\n🔍 检查前端代码中的硬编码...\n');

  const frontendPath = path.join(__dirname, '../../frontend/app');

  // 搜索硬编码的数字和文案
  const hardcodedPatterns = [
    { pattern: /12,?\d{3}.*一样/, description: '"12,843个和你一样的"类似文案' },
    { pattern: /63%.*完成.*第一单/, description: '"63%已完成第一单"类似文案' },
    { pattern: /视觉叙事者.*?=.*?['"]/, description: '硬编码的"视觉叙事者"' },
    { pattern: /const\s+\w+\s*=\s*['"].*叙事者.*['"]/, description: '固定的人格标签' }
  ];

  function searchInFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    hardcodedPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        const lines = content.split('\n');
        const lineNumbers = lines
          .map((line, i) => pattern.test(line) ? i + 1 : -1)
          .filter(n => n !== -1);

        results.push({
          category: '前端硬编码',
          item: path.relative(frontendPath, filePath),
          status: 'fake',
          evidence: `${description} (行${lineNumbers.join(',')})`,
          priority: 'P0'
        });
      }
    });
  }

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        searchInFile(fullPath);
      }
    });
  }

  if (fs.existsSync(frontendPath)) {
    walkDir(frontendPath);
  }
}

async function checkAPIEndpoints() {
  console.log('\n🔍 检查API端点实现...\n');

  const controllersPath = path.join(__dirname, '../src/controllers');

  // 检查关键控制器
  const criticalControllers = [
    { file: 'opcController.ts', name: 'OPC测评提交' },
    { file: 'semanticMatchingController.ts', name: '语义匹配' },
    { file: 'qichengTeacherController.ts', name: '启程老师翻译' },
    { file: 'opcV2AssessmentController.ts', name: 'OPC V2测评' }
  ];

  criticalControllers.forEach(({ file, name }) => {
    const filePath = path.join(controllersPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // 检查是否有真实的数据库操作
      const hasDbOps = /await\s+(query|queryOne)\(/.test(content);
      const hasAI = /anthropic|claude|openai/.test(content);

      if (hasDbOps) {
        results.push({
          category: 'API实现',
          item: name,
          status: hasAI ? 'real' : 'partial',
          evidence: hasAI ? '有数据库操作和AI调用' : '有数据库操作，无AI调用',
          priority: 'P0'
        });
      } else {
        results.push({
          category: 'API实现',
          item: name,
          status: 'fake',
          evidence: '控制器存在但没有数据库操作',
          priority: 'P0'
        });
      }
    } else {
      results.push({
        category: 'API实现',
        item: name,
        status: 'fake',
        evidence: '控制器文件不存在',
        priority: 'P0'
      });
    }
  });
}

async function generateReport() {
  // 统计
  const realCount = results.filter(r => r.status === 'real').length;
  const fakeCount = results.filter(r => r.status === 'fake').length;
  const partialCount = results.filter(r => r.status === 'partial').length;
  const total = results.length;

  console.log('\n' + '='.repeat(80));
  console.log('📊 启程平台AI系统诊断报告');
  console.log('='.repeat(80));
  console.log(`\n总体状态: ${realCount}个真实 / ${partialCount}个部分 / ${fakeCount}个空壳 (共${total}项)\n`);

  // 按优先级和状态分组
  const byCategory = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, DiagnosticResult[]>);

  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`\n### ${category}`);
    console.log('-'.repeat(80));

    items.forEach(item => {
      const icon = item.status === 'real' ? '✅' : item.status === 'partial' ? '⚠️' : '❌';
      const priority = item.priority === 'P0' ? '🔥' : item.priority === 'P1' ? '⚡' : '📌';
      console.log(`${icon} ${priority} ${item.item}`);
      console.log(`   ${item.evidence}`);
    });
  });

  // P0问题列表
  const p0Issues = results.filter(r => r.priority === 'P0' && r.status !== 'real');
  if (p0Issues.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('🚨 需要立即修复的P0问题');
    console.log('='.repeat(80));

    p0Issues.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.category} - ${issue.item}`);
      console.log(`   问题: ${issue.evidence}`);
      console.log(`   状态: ${issue.status === 'fake' ? '完全空壳' : '部分实现'}`);
    });
  }

  // 生成行动计划
  console.log('\n' + '='.repeat(80));
  console.log('🎯 修复行动计划');
  console.log('='.repeat(80));

  console.log('\n第一步: 连接真实数据（2小时）');
  console.log('- [ ] 前端调用真实API而不是mock数据');
  console.log('- [ ] 移除所有硬编码的人格标签和统计数字');
  console.log('- [ ] 从数据库查询真实的测评结果和匹配数据');

  console.log('\n第二步: 填充测试数据（1小时）');
  console.log('- [ ] 为10个测试学生生成真实OPC测评数据');
  console.log('- [ ] 触发AI为这些学生生成能力向量');
  console.log('- [ ] 创建3个测试任务并触发匹配');

  console.log('\n第三步: 验证端到端流程（1小时）');
  console.log('- [ ] 学生完成测评 → 看到真实的人格分析');
  console.log('- [ ] 企业发布任务 → AI匹配 → 推送学生');
  console.log('- [ ] 学生查看推荐任务 → 看到真实匹配分数');

  console.log('\n');
}

async function main() {
  try {
    await checkDatabase();
    await checkAPIEndpoints();
    checkFrontendCode();
    await generateReport();
  } catch (error) {
    console.error('诊断失败:', error);
  } finally {
    await pool.end();
  }
}

main();
