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

    logger.info(`找到 ${result.length} 个学生，开始重新生成embedding...`);
    logger.info('=====================================');

    for (const student of result) {
      logger.info(`\n正在处理学生: ${student.nickname || student.id}`);
      try {
        await hybridMatchingService.generateStudentEmbedding(student.id);
        logger.info(`✅ 成功生成embedding`);
      } catch (error: any) {
        logger.error(`❌ 失败: ${error.message}`);
      }
    }

    logger.info('\n=====================================');
    logger.info('所有学生embedding生成完成！');
    process.exit(0);
  } catch (error) {
    logger.error('错误:', error);
    process.exit(1);
  }
}

regenerateStudentEmbeddings();
