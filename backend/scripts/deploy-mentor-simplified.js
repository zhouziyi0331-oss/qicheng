// 简化版AI导师系统部署脚本
// 跳过orders表依赖，手动创建必要的表

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function deployMentorSystem() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        AI导师系统部署脚本（简化版）                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. 创建 mentor_alert_rules 表
    console.log('📦 创建 mentor_alert_rules 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentor_alert_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_type VARCHAR(50) NOT NULL UNIQUE,
        rule_name VARCHAR(100) NOT NULL,
        description TEXT,
        trigger_condition JSONB NOT NULL,
        alert_message_template TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ mentor_alert_rules 创建成功');

    // 2. 创建 mentor_alerts 表
    console.log('\n📦 创建 mentor_alerts 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentor_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        rule_type VARCHAR(50) NOT NULL,
        alert_message TEXT NOT NULL,
        alert_data JSONB,
        priority INTEGER DEFAULT 1,
        student_viewed BOOLEAN DEFAULT false,
        viewed_at TIMESTAMPTZ,
        student_responded BOOLEAN DEFAULT false,
        responded_at TIMESTAMPTZ,
        response_action VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_mentor_alerts_student
        ON mentor_alerts(student_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_mentor_alerts_task
        ON mentor_alerts(task_id);
      CREATE INDEX IF NOT EXISTS idx_mentor_alerts_unread
        ON mentor_alerts(student_id, student_viewed)
        WHERE student_viewed = false;
    `);
    console.log('✅ mentor_alerts 创建成功');

    // 3. 创建 mentor_student_profile_cache 表
    console.log('\n📦 创建 mentor_student_profile_cache 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentor_student_profile_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        profile_summary TEXT,
        six_dimensional_scores JSONB,
        guidance_style JSONB,
        learning_preferences JSONB,
        recent_performance_summary TEXT,
        last_updated TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_mentor_profile_cache_updated
        ON mentor_student_profile_cache(last_updated DESC);
    `);
    console.log('✅ mentor_student_profile_cache 创建成功');

    // 4. 创建 mentor_retrospectives 表
    console.log('\n📦 创建 mentor_retrospectives 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentor_retrospectives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        questions JSONB NOT NULL,
        answers JSONB,
        ai_insights TEXT,
        is_featured BOOLEAN DEFAULT false,
        featured_reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(task_id, student_id)
      );

      CREATE INDEX IF NOT EXISTS idx_retrospectives_student
        ON mentor_retrospectives(student_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_retrospectives_task
        ON mentor_retrospectives(task_id);
      CREATE INDEX IF NOT EXISTS idx_retrospectives_pending
        ON mentor_retrospectives(student_id, status)
        WHERE status = 'pending';
    `);
    console.log('✅ mentor_retrospectives 创建成功');

    // 5. 初始化预警规则
    console.log('\n📦 初始化预警规则...');
    await pool.query(`
      INSERT INTO mentor_alert_rules (rule_type, rule_name, description, trigger_condition, alert_message_template, priority)
      VALUES
        ('level_gap', '等级差距预警', '任务难度超出学生当前等级2级以上',
         '{"condition": "task_level - student_level >= 2"}',
         '这个任务的难度可能有点高，建议先完成一些基础任务再尝试。', 3),
        ('repeated_rejection', '重复被拒预警', '学生连续3次申请被拒',
         '{"condition": "consecutive_rejections >= 3"}',
         '最近几次申请都没成功，要不要调整一下申请策略？', 2),
        ('deadline_pressure', '截止日期压力预警', '距离截止日期不足3天且进度<50%',
         '{"condition": "days_to_deadline <= 3 AND progress < 0.5"}',
         '任务快到期了，需要加快进度。如果遇到困难，及时沟通。', 3),
        ('direction_mismatch', '方向偏离预警', '学生连续接受非主赛道任务',
         '{"condition": "off_track_tasks >= 3"}',
         '最近接的任务好像不太符合你的主方向，要不要重新规划一下？', 1)
      ON CONFLICT (rule_type) DO NOTHING;
    `);
    console.log('✅ 预警规则初始化成功');

    // 6. 扩展 mentor_growth_observations 表
    console.log('\n📦 扩展 mentor_growth_observations 表...');
    await pool.query(`
      ALTER TABLE mentor_growth_observations
      ADD COLUMN IF NOT EXISTS observation_category VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_significant BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tags TEXT[];
    `);
    console.log('✅ mentor_growth_observations 扩展成功');

    // 验证部署
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 验证部署结果');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const tables = ['mentor_alert_rules', 'mentor_alerts', 'mentor_student_profile_cache', 'mentor_retrospectives'];
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ✅ ${table}: ${result.rows[0].count} 条记录`);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║        ✅ AI导师系统部署完成！                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    await pool.end();
    return true;
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    await pool.end();
    return false;
  }
}

deployMentorSystem().then(success => {
  process.exit(success ? 0 : 1);
});
