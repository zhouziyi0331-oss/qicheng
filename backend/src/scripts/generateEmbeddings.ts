import { pool } from '../utils/db';
import logger from '../utils/logger';
import { embeddingService } from '../services/embeddingService';

async function generateTaskEmbeddings() {
  logger.info('开始生成任务embedding向量...');

  const result = await pool.query(`
    SELECT id, title, description, track, acceptance_criteria, level_required
    FROM tasks
    WHERE title_embedding IS NULL
    LIMIT 100
  `);

  logger.info(`找到 ${result.rows.length} 个待处理任务`);

  for (const task of result.rows) {
    try {
      const text = `
        标题: ${task.title}
        描述: ${task.description || ''}
        赛道: ${task.track || ''}
        等级要求: ${task.level_required || 0}
        验收标准: ${task.acceptance_criteria || ''}
      `.trim();

      logger.info(`处理任务 ${task.id}: ${task.title}`);
      const embedding = await embeddingService.generateEmbedding(text);

      await pool.query(
        'UPDATE tasks SET title_embedding = $1 WHERE id = $2',
        [`[${embedding.join(',')}]`, task.id]
      );

      logger.info(`✓ 任务 ${task.id} embedding已生成`);
    } catch (error) {
      logger.error(`✗ 任务 ${task.id} 失败:`, error);
    }
  }

  logger.info('任务embedding生成完成');
}

async function generateStudentEmbeddings() {
  logger.info('开始生成学生embedding向量...');

  const result = await pool.query(`
    SELECT
      u.id,
      u.nickname,
      u.university,
      u.major,
      u.opc_personality_tag,
      u.track,
      u.current_level,
      u.current_level,
      sp.opc_label,
      sa.openness,
      sa.persistence,
      sa.creativity,
      sa.primary_track,
      sa.current_level
    FROM users u
    LEFT JOIN users u ON u.id = u.id
    LEFT JOIN student_abilities sa ON u.id = sa.user_id
    WHERE u.role = 'student' AND u.skills_embedding IS NULL
    LIMIT 100
  `);

  logger.info(`找到 ${result.rows.length} 个待处理学生`);

  for (const student of result.rows) {
    try {
      const text = `
        昵称: ${student.nickname || ''}
        学校: ${student.university || ''}
        专业: ${student.major || ''}
        OPC性格标签: ${student.opc_personality_tag || ''}
        OPC标签: ${student.opc_label || ''}
        赛道: ${student.track || student.primary_track || ''}
        等级: A赛道${student.current_level || 0}级, B赛道${student.level_b || 0}级, 当前${student.current_level || 0}级
        能力: 开放性${student.openness || 50}, 坚持性${student.persistence || 50}, 创造性${student.creativity || 50}
      `.trim();

      logger.info(`处理学生 ${student.id}: ${student.nickname || 'unknown'}`);
      const embedding = await embeddingService.generateEmbedding(text);

      await pool.query(
        'UPDATE users SET skills_embedding = $1, interests_embedding = $1, profile_embedding = $1 WHERE id = $2',
        [JSON.stringify(embedding), student.id]
      );

      logger.info(`✓ 学生 ${student.id} embedding已生成`);
    } catch (error) {
      logger.error(`✗ 学生 ${student.id} 失败:`, error);
    }
  }

  logger.info('学生embedding生成完成');
}

async function main() {
  try {
    await generateTaskEmbeddings();
    await generateStudentEmbeddings();

    // 显示统计信息
    const taskStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(title_embedding) as with_embedding
      FROM tasks
    `);

    const studentStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(skills_embedding) as with_embedding
      FROM users
      WHERE role = 'student'
    `);

    logger.info('\n=== 统计信息 ===');
    logger.info(`任务: ${taskStats.rows[0].with_embedding}/${taskStats.rows[0].total} 已生成embedding`);
    logger.info(`学生: ${studentStats.rows[0].with_embedding}/${studentStats.rows[0].total} 已生成embedding`);

  } catch (error) {
    logger.error('生成embedding失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
