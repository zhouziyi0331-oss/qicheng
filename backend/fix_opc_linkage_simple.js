/**
 * 简单修复脚本 - 直接同步OPC数据到student_capabilities
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function fixOPCLinkage() {
  const client = await pool.connect();
  
  try {
    console.log('开始修复OPC联动...\n');
    
    // 1. 获取所有OPC结果
    const opcResults = await client.query(`
      SELECT
        r.student_id,
        r.personality_label,
        r.info_processing_score,
        r.creation_drive_score,
        r.tool_learning_score,
        r.task_execution_score,
        r.collaboration_score,
        r.risk_attitude_score
      FROM opc_v2_results r
    `);
    
    console.log(`找到 ${opcResults.rows.length} 个OPC测试结果\n`);
    
    for (const opc of opcResults.rows) {
      console.log(`处理学生: ${opc.student_id}`);
      console.log(`  人格标签: ${opc.personality_label}`);
      
      // 2. 生成画像摘要
      const parts = [];
      parts.push(`人格类型：${opc.personality_label}`);
      
      if (opc.info_processing_score >= 60) {
        parts.push('整合型思维，善于把握全局');
      } else if (opc.info_processing_score <= 40) {
        parts.push('拆解型思维，善于细节执行');
      }
      
      if (opc.creation_drive_score >= 60) {
        parts.push('视觉驱动，擅长创意设计');
      } else if (opc.creation_drive_score <= 40) {
        parts.push('逻辑驱动，擅长功能开发');
      }
      
      if (opc.tool_learning_score >= 60) {
        parts.push('探索型学习者');
      } else if (opc.tool_learning_score <= 40) {
        parts.push('手册型学习者');
      }
      
      if (opc.task_execution_score >= 60) {
        parts.push('规划型执行');
      } else if (opc.task_execution_score <= 40) {
        parts.push('迭代型执行');
      }
      
      if (opc.collaboration_score >= 60) {
        parts.push('喜欢团队协作');
      } else if (opc.collaboration_score <= 40) {
        parts.push('偏好独立工作');
      }
      
      if (opc.risk_attitude_score >= 60) {
        parts.push('愿意接受挑战');
      } else if (opc.risk_attitude_score <= 40) {
        parts.push('偏好稳健任务');
      }
      
      const profileSummary = parts.join('，');
      
      console.log(`  画像摘要: ${profileSummary}`);
      
      // 3. 更新student_capabilities
      await client.query(`
        UPDATE student_capabilities
        SET
          personality_style = $1,
          profile_summary = $2,
          updated_at = NOW()
        WHERE student_id = $3
      `, [opc.personality_label, profileSummary, opc.student_id]);
      
      console.log(`  ✓ 已更新student_capabilities\n`);
    }
    
    console.log('修复完成！');
    
  } catch (error) {
    console.error('修复失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixOPCLinkage().catch(console.error);
