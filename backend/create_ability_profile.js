/**
 * 创建user_ability_profiles记录
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function createAbilityProfile() {
  const client = await pool.connect();
  
  try {
    console.log('创建user_ability_profiles记录...\n');
    
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
    
    // 创建user_ability_profiles记录
    const result = await client.query(`
      INSERT INTO user_ability_profiles (
        user_id,
        information_processing,
        creative_drive,
        tool_learning,
        task_execution,
        collaboration_tendency,
        risk_attitude,
        personality_label,
        profile_summary,
        version,
        is_current,
        updated_reason,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, true, 'OPC v2测试完成', NOW(), NOW())
      ON CONFLICT (user_id, version) DO UPDATE SET
        information_processing = EXCLUDED.information_processing,
        creative_drive = EXCLUDED.creative_drive,
        tool_learning = EXCLUDED.tool_learning,
        task_execution = EXCLUDED.task_execution,
        collaboration_tendency = EXCLUDED.collaboration_tendency,
        risk_attitude = EXCLUDED.risk_attitude,
        personality_label = EXCLUDED.personality_label,
        profile_summary = EXCLUDED.profile_summary,
        is_current = true,
        updated_at = NOW()
      RETURNING id
    `, [
      studentId,
      opc.info_processing_score,
      opc.creation_drive_score,
      opc.tool_learning_score,
      opc.task_execution_score,
      opc.collaboration_score,
      opc.risk_attitude_score,
      opc.personality_label,
      `${opc.personality_label}：信息处理${opc.info_processing_score}分，创作驱动${opc.creation_drive_score}分，工具学习${opc.tool_learning_score}分，任务执行${opc.task_execution_score}分，协作倾向${opc.collaboration_score}分，风险态度${opc.risk_attitude_score}分`
    ]);
    
    console.log('✓ user_ability_profiles记录已创建');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  学生ID: ${studentId}`);
    console.log(`  人格标签: ${opc.personality_label}`);
    
  } catch (error) {
    console.error('创建失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAbilityProfile().catch(console.error);
