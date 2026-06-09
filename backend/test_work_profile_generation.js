/**
 * 测试工作条件画像生成
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function testWorkProfileGeneration() {
  const client = await pool.connect();
  
  try {
    console.log('测试工作条件画像生成...\n');
    
    const studentId = '99999999-9999-9999-9999-999999999999';
    
    // 获取OPC结果
    const opcResult = await client.query(`
      SELECT * FROM opc_v2_results WHERE student_id = $1
    `, [studentId]);
    
    if (opcResult.rows.length === 0) {
      console.log('未找到OPC结果');
      return;
    }
    
    const opc = opcResult.rows[0];
    console.log('OPC结果:');
    console.log(`  人格标签: ${opc.personality_label}`);
    console.log(`  信息处理: ${opc.info_processing_score}`);
    console.log(`  创作驱动: ${opc.creation_drive_score}`);
    console.log(`  工具学习: ${opc.tool_learning_score}`);
    console.log(`  任务执行: ${opc.task_execution_score}`);
    console.log(`  协作倾向: ${opc.collaboration_score}`);
    console.log(`  风险态度: ${opc.risk_attitude_score}`);
    console.log('');
    
    // 生成工作条件画像数据
    const profileText = `${opc.personality_label}。信息处理倾向：${opc.info_processing_tendency}，创作驱动：${opc.creation_drive_tendency}，工具学习：${opc.tool_learning_tendency}，任务执行：${opc.task_execution_tendency}，协作倾向：${opc.collaboration_tendency}，风险态度：${opc.risk_attitude_tendency}。`;
    
    // 简化版：直接插入工作条件画像（不生成向量）
    const result = await client.query(`
      INSERT INTO student_work_condition_profiles (
        student_id,
        information_reception,
        creation_drive,
        learning_approach,
        execution_rhythm,
        autonomy_need,
        risk_tolerance,
        profile_text,
        core_strengths,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (student_id) DO UPDATE SET
        information_reception = EXCLUDED.information_reception,
        creation_drive = EXCLUDED.creation_drive,
        learning_approach = EXCLUDED.learning_approach,
        execution_rhythm = EXCLUDED.execution_rhythm,
        autonomy_need = EXCLUDED.autonomy_need,
        risk_tolerance = EXCLUDED.risk_tolerance,
        profile_text = EXCLUDED.profile_text,
        core_strengths = EXCLUDED.core_strengths,
        updated_at = NOW()
      RETURNING id
    `, [
      studentId,
      JSON.stringify({
        preference: opc.info_processing_score >= 60 ? '整合型思维' : '拆解型思维',
        idealCondition: '有明确的方向和参考案例',
        unsuitableCondition: '完全没有背景信息',
        clientType: '能提供基本方向的需求方'
      }),
      JSON.stringify({
        source: opc.creation_drive_score >= 60 ? '视觉驱动' : '逻辑驱动',
        motivation: '看到自己的想法变成可见的成果',
        unsuitableTask: '纯粹重复性的任务',
        projectType: opc.creation_drive_score >= 60 ? '视觉设计、UI/UX' : '功能开发、系统设计'
      }),
      JSON.stringify({
        style: opc.tool_learning_score >= 60 ? '探索型学习' : '手册型学习',
        idealStart: '有明确的第一步可以立刻开始',
        unsuitableStart: '需要先看大量文档',
        mentorStyle: '给一个起点，让他边做边学'
      }),
      JSON.stringify({
        pattern: opc.task_execution_score >= 60 ? '规划型执行' : '迭代型执行',
        idealCycle: '有基本的里程碑',
        unsuitableCycle: '完全没有规划的混乱项目',
        clientExpectation: '需求方有基本的计划'
      }),
      JSON.stringify({
        level: opc.collaboration_score >= 60 ? '喜欢团队协作' : '偏好独立工作',
        idealCollaboration: '有明确的分工，定期同步进度',
        unsuitableCollaboration: '完全孤立的工作'
      }),
      JSON.stringify({
        attitude: opc.risk_attitude_score >= 60 ? '愿意接受挑战' : '偏好稳健任务',
        idealChallenge: '有挑战但有参考案例',
        unsuitableChallenge: '完全从零探索'
      }),
      profileText,
      opc.creation_drive_score >= 60 ? ['视觉设计', 'UI/UX', '创意内容'] : ['功能开发', '系统设计', '数据分析']
    ]);
    
    console.log('✓ 工作条件画像已生成');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  画像文本: ${profileText}`);
    
  } catch (error) {
    console.error('生成失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testWorkProfileGeneration().catch(console.error);
