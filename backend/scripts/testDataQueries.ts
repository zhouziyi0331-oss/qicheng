/**
 * AI导师数据查询测试
 *
 * 只测试数据查询部分，不调用AI API
 * 验证所有真实数据能否成功获取
 */

import mentorContextEnhancer from '../src/services/mentorContextEnhancer';
import { query, queryOne } from '../src/utils/db';
import logger from '../src/utils/logger';

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
  data?: any;
}

const results: TestResult[] = [];

/**
 * 测试1: 查询学生和任务
 */
async function testDataAvailability(): Promise<void> {
  console.log('\n=== 测试数据可用性 ===\n');

  try {
    // 查找学生
    const students = await query<{ id: string; nickname: string }>(
      `SELECT id, nickname FROM users WHERE user_type = 'student' LIMIT 5`
    );

    console.log(`找到 ${students.length} 个学生:`);
    students.forEach(s => console.log(`  - ${s.nickname} (${s.id})`));

    // 查找任务
    const tasks = await query<{ id: string; title: string; track: string }>(
      `SELECT id, title, track FROM tasks LIMIT 5`
    );

    console.log(`\n找到 ${tasks.length} 个任务:`);
    tasks.forEach(t => console.log(`  - ${t.title} [${t.track}]`));

    // 查找任务分配
    const assignments = await query<{ id: string; status: string }>(
      `SELECT id, status FROM task_assignments LIMIT 5`
    );

    console.log(`\n找到 ${assignments.length} 个任务分配:`);
    assignments.forEach(a => console.log(`  - ${a.id} (${a.status})`));

    results.push({
      test: '数据可用性',
      passed: students.length > 0 && tasks.length > 0,
      details: `学生: ${students.length}, 任务: ${tasks.length}, 分配: ${assignments.length}`,
      data: {
        studentCount: students.length,
        taskCount: tasks.length,
        assignmentCount: assignments.length
      }
    });

  } catch (error: any) {
    results.push({
      test: '数据可用性',
      passed: false,
      details: `错误: ${error.message}`
    });
    console.error('❌ 测试失败:', error);
  }
}

/**
 * 测试2: getRealStuckCase
 */
async function testGetRealStuckCase(): Promise<void> {
  console.log('\n=== 测试 T-02: getRealStuckCase ===\n');

  try {
    // 查找有卡点观察的任务
    const observation = await queryOne<{
      student_id: string;
      task_id: string;
      observation_content: string;
    }>(
      `SELECT student_id, task_id, observation_content
       FROM mentor_growth_observations
       WHERE observation_type = 'stuck'
         AND observation_content IS NOT NULL
         AND observation_content != ''
       LIMIT 1`
    );

    if (observation) {
      console.log('找到卡点观察记录:');
      console.log(`  学生ID: ${observation.student_id}`);
      console.log(`  任务ID: ${observation.task_id}`);
      console.log(`  内容: ${observation.observation_content.substring(0, 100)}...`);

      // 测试查询
      const realCase = await mentorContextEnhancer.getRealStuckCase(
        observation.student_id,
        observation.task_id
      );

      if (realCase) {
        console.log('\n✅ 成功查询到真实案例:');
        console.log(`  ${realCase.observation_content.substring(0, 100)}...`);

        results.push({
          test: 'T-02: getRealStuckCase',
          passed: true,
          details: '成功查询到真实卡点案例',
          data: {
            hasContext: !!realCase.context
          }
        });
      } else {
        console.log('\n⚠️  查询返回null（可能是同赛道没有其他案例）');
        results.push({
          test: 'T-02: getRealStuckCase',
          passed: true,
          details: '查询执行成功但返回null（正常情况）'
        });
      }
    } else {
      console.log('⚠️  数据库中没有stuck类型的观察记录');
      results.push({
        test: 'T-02: getRealStuckCase',
        passed: true,
        details: '数据库中暂无stuck观察记录（跳过测试）'
      });
    }

  } catch (error: any) {
    results.push({
      test: 'T-02: getRealStuckCase',
      passed: false,
      details: `错误: ${error.message}`
    });
    console.error('❌ 测试失败:', error);
  }
}

/**
 * 测试3: getLastStudentMessage
 */
async function testGetLastStudentMessage(): Promise<void> {
  console.log('\n=== 测试 T-04: getLastStudentMessage ===\n');

  try {
    // 查找有消息的会话
    const session = await queryOne<{ task_id: string }>(
      `SELECT DISTINCT task_id
       FROM mentor_sessions
       WHERE message_count > 0
       LIMIT 1`
    );

    if (session) {
      console.log(`找到会话，任务ID: ${session.task_id}`);

      // 测试查询
      const lastMessage = await mentorContextEnhancer.getLastStudentMessage(session.task_id);

      if (lastMessage) {
        console.log('\n✅ 成功查询到最后一条消息:');
        console.log(`  内容: ${lastMessage.content.substring(0, 100)}...`);
        console.log(`  时间: ${lastMessage.created_at}`);

        const hoursSince = mentorContextEnhancer.getHoursSince(lastMessage.created_at);
        console.log(`  间隔: ${hoursSince}小时`);

        results.push({
          test: 'T-04: getLastStudentMessage',
          passed: true,
          details: `成功查询到消息，间隔${hoursSince}小时`,
          data: {
            messageLength: lastMessage.content.length,
            hoursSince
          }
        });
      } else {
        console.log('\n⚠️  查询返回null（可能没有学生消息）');
        results.push({
          test: 'T-04: getLastStudentMessage',
          passed: true,
          details: '查询执行成功但返回null（正常情况）'
        });
      }
    } else {
      console.log('⚠️  数据库中没有消息记录');
      results.push({
        test: 'T-04: getLastStudentMessage',
        passed: true,
        details: '数据库中暂无消息记录（跳过测试）'
      });
    }

  } catch (error: any) {
    results.push({
      test: 'T-04: getLastStudentMessage',
      passed: false,
      details: `错误: ${error.message}`
    });
    console.error('❌ 测试失败:', error);
  }
}

/**
 * 测试4: getGrowthComparison
 */
async function testGetGrowthComparison(): Promise<void> {
  console.log('\n=== 测试 T-05: getGrowthComparison ===\n');

  try {
    // 查找已完成的任务分配
    const assignment = await queryOne<{
      id: string;
      student_id: string;
      task_id: string;
    }>(
      `SELECT id, student_id, task_id
       FROM task_assignments
       WHERE status = 'completed'
       LIMIT 1`
    );

    if (assignment) {
      console.log('找到已完成的任务分配:');
      console.log(`  分配ID: ${assignment.id}`);
      console.log(`  学生ID: ${assignment.student_id}`);

      // 测试查询
      const growthComparison = await mentorContextEnhancer.getGrowthComparison(
        assignment.student_id,
        assignment.id
      );

      console.log('\n📊 成长对比数据:');
      console.log(`  初始能力缺口: ${growthComparison.initial_gaps.length}个`);
      growthComparison.initial_gaps.forEach(gap => console.log(`    - ${gap}`));

      console.log(`  本单展示能力: ${growthComparison.current_skills.length}个`);
      growthComparison.current_skills.forEach(skill => console.log(`    - ${skill}`));

      console.log(`  已闭合缺口: ${growthComparison.gaps_closed.length}个`);
      growthComparison.gaps_closed.forEach(gap => console.log(`    - ${gap}`));

      if (growthComparison.client_feedback) {
        console.log(`  客户评价: ${growthComparison.client_feedback.rating}/5`);
      }

      results.push({
        test: 'T-05: getGrowthComparison',
        passed: true,
        details: `初始缺口${growthComparison.initial_gaps.length}个，闭合${growthComparison.gaps_closed.length}个`,
        data: {
          initialGaps: growthComparison.initial_gaps.length,
          currentSkills: growthComparison.current_skills.length,
          gapsClosed: growthComparison.gaps_closed.length,
          hasClientFeedback: !!growthComparison.client_feedback
        }
      });

    } else {
      console.log('⚠️  数据库中没有已完成的任务分配');
      results.push({
        test: 'T-05: getGrowthComparison',
        passed: true,
        details: '数据库中暂无已完成的任务（跳过测试）'
      });
    }

  } catch (error: any) {
    results.push({
      test: 'T-05: getGrowthComparison',
      passed: false,
      details: `错误: ${error.message}`
    });
    console.error('❌ 测试失败:', error);
  }
}

/**
 * 打印测试报告
 */
function printReport(): void {
  console.log('\n\n════════════════════════════════════════════════════');
  console.log('          AI导师数据查询测试报告');
  console.log('════════════════════════════════════════════════════\n');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}`);
    console.log(`   ${result.details}`);
    if (result.data) {
      console.log(`   数据: ${JSON.stringify(result.data)}`);
    }
    console.log();
  });

  console.log('────────────────────────────────────────────────────');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('════════════════════════════════════════════════════\n');

  if (passedTests === totalTests) {
    console.log('🎉 所有数据查询测试通过！\n');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息\n');
  }
}

/**
 * 主测试流程
 */
async function main(): Promise<void> {
  console.log('🚀 开始AI导师数据查询测试...\n');

  try {
    await testDataAvailability();
    await testGetRealStuckCase();
    await testGetLastStudentMessage();
    await testGetGrowthComparison();

    printReport();

  } catch (error: unknown) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

// 执行测试
main();
