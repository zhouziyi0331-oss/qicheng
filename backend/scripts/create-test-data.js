/**
 * 端到端测试脚本
 * 创建测试用户和测试数据
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function createTestData() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始创建测试数据...\n');

    // 1. 创建测试企业用户
    console.log('1️⃣ 创建测试企业用户...');
    const companyPassword = await bcrypt.hash('test123456', 10);

    const companyResult = await client.query(`
      INSERT INTO users (
        phone, password_hash, role, nickname, email, is_active
      ) VALUES (
        '13800000001', $1, 'company', '测试企业', 'test-company@qicheng.com', true
      )
      ON CONFLICT (phone) DO UPDATE
      SET nickname = EXCLUDED.nickname
      RETURNING id, phone, nickname, role
    `, [companyPassword]);

    const companyUser = companyResult.rows[0];
    console.log(`   ✅ 企业用户: ${companyUser.nickname} (${companyUser.phone})`);
    console.log(`   📱 手机号: 13800000001`);
    console.log(`   🔑 密码: test123456\n`);

    // 2. 创建测试学生用户
    console.log('2️⃣ 创建测试学生用户...');
    const studentPassword = await bcrypt.hash('test123456', 10);

    const students = [];
    for (let i = 1; i <= 5; i++) {
      const studentResult = await client.query(`
        INSERT INTO users (
          phone, password_hash, role, nickname, email, is_active
        ) VALUES (
          $1, $2, 'student', $3, $4, true
        )
        ON CONFLICT (phone) DO UPDATE
        SET nickname = EXCLUDED.nickname
        RETURNING id, phone, nickname, role
      `, [
        `1380000000${i + 1}`,
        studentPassword,
        `测试学生${i}`,
        `test-student${i}@qicheng.com`
      ]);

      students.push(studentResult.rows[0]);
      console.log(`   ✅ 学生${i}: ${studentResult.rows[0].nickname} (${studentResult.rows[0].phone})`);
    }
    console.log(`   🔑 所有学生密码: test123456\n`);

    // 3. 为学生创建能力画像
    console.log('3️⃣ 创建学生能力画像...');
    for (const student of students) {
      await client.query(`
        INSERT INTO student_capabilities (
          student_id, skills, tasks_completed, avg_task_quality,
          avg_client_satisfaction, on_time_delivery_rate,
          quality_trend, growth_rate, preferred_task_types,
          opc_openness, opc_persistence, opc_creativity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (student_id) DO UPDATE
        SET skills = EXCLUDED.skills
      `, [
        student.id,
        JSON.stringify({
          'React': { proficiency: 0.7 + Math.random() * 0.2, confidence: 0.8 },
          'Node.js': { proficiency: 0.6 + Math.random() * 0.2, confidence: 0.75 },
          'TypeScript': { proficiency: 0.65 + Math.random() * 0.2, confidence: 0.7 },
          'JavaScript': { proficiency: 0.8 + Math.random() * 0.15, confidence: 0.85 }
        }),
        Math.floor(Math.random() * 10) + 5, // tasks_completed
        0.75 + Math.random() * 0.2, // avg_task_quality
        0.8 + Math.random() * 0.15, // avg_client_satisfaction
        0.85 + Math.random() * 0.1, // on_time_delivery_rate
        'improving',
        0.15 + Math.random() * 0.1,
        ['web_development', 'frontend'],
        Math.floor(Math.random() * 3) + 3, // opc_openness
        Math.floor(Math.random() * 3) + 3, // opc_persistence
        Math.floor(Math.random() * 3) + 3  // opc_creativity
      ]);
      console.log(`   ✅ ${student.nickname} 能力画像已创建`);
    }
    console.log();

    // 4. 创建测试任务
    console.log('4️⃣ 创建测试任务...');
    const taskResult = await client.query(`
      INSERT INTO tasks (
        company_id, title, description, track, level_required,
        budget_gross, budget_net, deadline, status, estimated_minutes,
        acceptance_criteria
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NOW() + INTERVAL '14 days', 'active', $8, $9
      )
      RETURNING id, title, status
    `, [
      companyUser.id,
      '开发一个React任务管理系统',
      '需要开发一个基于React的任务管理系统，包含任务创建、编辑、删除、状态管理等功能。要求使用TypeScript，具备良好的代码规范和注释。',
      'A', // track
      3, // level_required
      5000, // budget_gross
      4250, // budget_net (85%)
      2400, // estimated_minutes (40 hours)
      '1. 完成任务列表展示功能\n2. 实现任务的增删改查\n3. 实现任务状态管理\n4. 代码使用TypeScript\n5. 代码规范，有注释' // acceptance_criteria
    ]);

    const task = taskResult.rows[0];
    console.log(`   ✅ 任务: ${task.title}`);
    console.log(`   📋 任务ID: ${task.id}`);
    console.log(`   💰 预算: ¥5000`);
    console.log(`   ⏱️  预计工时: 40小时\n`);

    // 5. 创建任务翻译
    console.log('5️⃣ 创建任务翻译（启程老师）...');
    await client.query(`
      INSERT INTO task_translations (
        task_id, functional_modules, student_friendly_title,
        student_friendly_description, what_you_will_do,
        what_you_will_learn, required_skills,
        difficulty_technical, difficulty_cognitive,
        difficulty_execution, difficulty_overall,
        learning_value, career_impact, estimated_hours
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (task_id) DO UPDATE
      SET student_friendly_title = EXCLUDED.student_friendly_title
    `, [
      task.id,
      JSON.stringify([
        {
          module: '任务列表展示',
          description: '显示所有任务，支持筛选和排序',
          skills: ['React', 'TypeScript'],
          difficulty: 2
        },
        {
          module: '任务CRUD操作',
          description: '创建、编辑、删除任务的功能',
          skills: ['React', 'TypeScript', 'State Management'],
          difficulty: 3
        },
        {
          module: '状态管理',
          description: '管理任务的不同状态（待办、进行中、已完成）',
          skills: ['React', 'State Management'],
          difficulty: 3
        }
      ]),
      '做一个任务管理小应用',
      '这是一个帮助用户管理日常任务的Web应用。你会学到如何用React构建一个完整的应用，包括数据的增删改查。',
      '你需要：1) 设计任务列表的界面 2) 实现添加、编辑、删除任务的功能 3) 让任务可以标记为完成或进行中 4) 用TypeScript保证代码质量',
      '你会学到：1) React组件开发 2) TypeScript类型系统 3) 状态管理 4) 用户交互设计',
      JSON.stringify([
        { skill: 'React', proficiency: 0.7, weight: 0.4, why: '需要构建用户界面' },
        { skill: 'TypeScript', proficiency: 0.6, weight: 0.3, why: '需要类型安全' },
        { skill: 'Node.js', proficiency: 0.5, weight: 0.2, why: '可能需要简单的后端' }
      ]),
      6.5, // difficulty_technical
      5.0, // difficulty_cognitive
      6.0, // difficulty_execution
      6.0, // difficulty_overall
      0.85, // learning_value
      0.75, // career_impact
      40
    ]);
    console.log(`   ✅ 任务翻译已创建\n`);

    // 6. 输出测试信息
    console.log('📊 测试数据创建完成！\n');
    console.log('=' .repeat(60));
    console.log('🔐 登录信息');
    console.log('=' .repeat(60));
    console.log('\n企业账号:');
    console.log(`  手机号: 13800000001`);
    console.log(`  密码: test123456`);
    console.log(`  用户ID: ${companyUser.id}`);

    console.log('\n学生账号:');
    students.forEach((s, i) => {
      console.log(`  学生${i + 1}: 1380000000${i + 2} / test123456 (ID: ${s.id})`);
    });

    console.log('\n测试任务:');
    console.log(`  任务ID: ${task.id}`);
    console.log(`  标题: ${task.title}`);
    console.log(`  状态: ${task.status}`);

    console.log('\n=' .repeat(60));
    console.log('🧪 测试步骤');
    console.log('=' .repeat(60));
    console.log('\n1. 企业端测试:');
    console.log('   - 用 13800000001 登录');
    console.log('   - 进入任务详情页');
    console.log('   - 点击"AI智能匹配"按钮');
    console.log('   - 查看匹配的学生列表');
    console.log('   - 选择学生并推送任务');

    console.log('\n2. 学生端测试:');
    console.log('   - 用 13800000002-13800000006 任一账号登录');
    console.log('   - 进入"推荐任务"页面');
    console.log('   - 查看推送的任务');
    console.log('   - 查看匹配详情');
    console.log('   - 接受任务');

    console.log('\n3. 数据验证:');
    console.log('   - 检查 task_student_matches 表');
    console.log('   - 检查匹配分数和详情');
    console.log('   - 验证推送状态');

    console.log('\n=' .repeat(60));
    console.log('✅ 准备就绪！可以开始测试了！');
    console.log('=' .repeat(60));
    console.log();

    return {
      company: companyUser,
      students,
      task
    };

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行
createTestData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
