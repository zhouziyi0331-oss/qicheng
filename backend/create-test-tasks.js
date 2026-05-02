const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function createTestTasks() {
  try {
    const tasks = [
      {
        title: '设计一个移动应用的用户界面',
        description: '为一款健康管理应用设计简洁美观的用户界面，包括首页、数据展示页和个人中心页。要求符合Material Design规范。',
        track: 'A',
        level_required: 1,
        budget_net: 500,
        estimated_minutes: 180,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后
      },
      {
        title: '编写Python数据分析脚本',
        description: '使用pandas和matplotlib分析销售数据，生成可视化报表。需要清洗数据、计算关键指标并绘制图表。',
        track: 'B',
        level_required: 2,
        budget_net: 800,
        estimated_minutes: 240,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        title: '撰写产品使用手册',
        description: '为一款项目管理软件撰写用户使用手册，包括功能介绍、操作步骤和常见问题解答。要求语言简洁易懂。',
        track: 'A',
        level_required: 1,
        budget_net: 600,
        estimated_minutes: 200,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: '制作教学视频',
        description: '录制一个10分钟的Excel数据透视表教学视频，要求画面清晰、讲解详细、配有字幕。',
        track: 'A',
        level_required: 2,
        budget_net: 1000,
        estimated_minutes: 300,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      {
        title: '开发简单的网页计算器',
        description: '使用HTML、CSS和JavaScript开发一个网页计算器，支持基本的加减乘除运算，界面美观。',
        track: 'B',
        level_required: 1,
        budget_net: 400,
        estimated_minutes: 120,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ];

    console.log('开始创建测试任务...\n');

    for (const task of tasks) {
      const result = await pool.query(`
        INSERT INTO tasks (
          title, description, track, level_required,
          budget_net, estimated_minutes, deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
        RETURNING id, title
      `, [
        task.title,
        task.description,
        task.track,
        task.level_required,
        task.budget_net,
        task.estimated_minutes,
        task.deadline
      ]);

      console.log(`✓ 创建任务: ${result.rows[0].title}`);
    }

    console.log(`\n成功创建 ${tasks.length} 个测试任务！`);

    // 验证
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM tasks WHERE status = 'active' AND deleted_at IS NULL"
    );
    console.log(`\n当前活跃任务总数: ${countResult.rows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('创建任务失败:', error);
    process.exit(1);
  }
}

createTestTasks();
