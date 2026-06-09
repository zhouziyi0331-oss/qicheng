/**
 * 创建user_ability_profiles记录（修复版）
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
    
    // 检查是否已存在
    const existing = await client.query(`
      SELECT id FROM user_ability_profiles WHERE user_id = $1
    `, [studentId]);
    
    if (existing.rows.length > 0) {
      console.log('记录已存在，更新中...');
      
      // 更新现有记录
      await client.query(`
        UPDATE user_ability_profiles SET
          information_processing = $1,
          creative_drive = $2,
          tool_learning = $3,
          task_execution = $4,
          collaboration_tendency = $5,
          risk_attitude = $6,
          personality_label = $7,
          profile_summary = $8,
          is_current = true,
          updated_at = NOW()
        WHERE user_id = $9
      `, [
        opc.info_processing_score,
        opc.creation_drive_score,
        opc.tool_learning_score,
        opc.task_execution_score,
        opc.collaboration_score,
        opc.risk_attitude_score,
        opc.personality_label,
        `${opc.personality_label}：信息处理${opc.info_processing_score}分，创作驱动${opc.creation_drive_score}分，工具学习${opc.tool_learning_score}分，任务执行${opc.task_execution_score}分，协作倾向${opc.collaboration_score}分，风险态度${opc.risk_attitude_score}分`,
        studentId
      ]);
      
      console.log('✓ user_ability_profiles记录已更新');
    } else {
      // 创建新记录
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
    }
    
    console.log(`  学生ID: ${studentId}`);
    console.log(`  人格标签: ${opc.personality_label}`);
    console.log(`  六维分数: 信息处理${opc.info_processing_score}, 创作驱动${opc.creation_drive_score}, 工具学习${opc.tool_learning_score}, 任务执行${opc.task_execution_score}, 协作倾向${opc.collaboration_score}, 风险态度${opc.risk_attitude_score}`);
    
  } catch (error) {
    console.error('创建失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAbilityProfile().catch(console.error);
