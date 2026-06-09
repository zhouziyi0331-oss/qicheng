import { hybridMatchingService } from '../services/hybridMatchingService';
import pool from '../utils/db';

async function regenerateStudentEmbeddings() {
  try {
    // 获取所有学生ID
    const result = await pool.query(`
      SELECT u.id, u.nickname
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.created_at
    `) as any;

    console.log(`找到 ${result.length} 个学生，开始重新生成embedding...`);
    console.log('=====================================');

    for (const student of result) {
      console.log(`\n正在处理学生: ${student.nickname || student.id}`);
      try {
        await hybridMatchingService.generateStudentEmbedding(student.id);
        console.log(`✅ 成功生成embedding`);
      } catch (error: any) {
        console.error(`❌ 失败: ${error.message}`);
      }
    }

    console.log('\n=====================================');
    console.log('所有学生embedding生成完成！');
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

regenerateStudentEmbeddings();
