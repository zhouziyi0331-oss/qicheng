"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const embeddingService_1 = require("../services/embeddingService");
async function generateTaskEmbeddings() {
    console.log('开始生成任务embedding向量...');
    const result = await db_1.pool.query(`
    SELECT id, title, description, track, acceptance_criteria, level_required
    FROM tasks
    WHERE title_embedding IS NULL
    LIMIT 100
  `);
    console.log(`找到 ${result.rows.length} 个待处理任务`);
    for (const task of result.rows) {
        try {
            const text = `
        标题: ${task.title}
        描述: ${task.description || ''}
        赛道: ${task.track || ''}
        等级要求: ${task.level_required || 0}
        验收标准: ${task.acceptance_criteria || ''}
      `.trim();
            console.log(`处理任务 ${task.id}: ${task.title}`);
            const embedding = await embeddingService_1.embeddingService.generateEmbedding(text);
            await db_1.pool.query('UPDATE tasks SET title_embedding = $1 WHERE id = $2', [`[${embedding.join(',')}]`, task.id]);
            console.log(`✓ 任务 ${task.id} embedding已生成`);
        }
        catch (error) {
            console.error(`✗ 任务 ${task.id} 失败:`, error);
        }
    }
    console.log('任务embedding生成完成');
}
async function generateStudentEmbeddings() {
    console.log('开始生成学生embedding向量...');
    const result = await db_1.pool.query(`
    SELECT
      u.id,
      u.nickname,
      u.university,
      u.major,
      u.opc_personality_tag,
      sp.track,
      sp.level_a,
      sp.level_b,
      sp.opc_label,
      sa.openness,
      sa.persistence,
      sa.creativity,
      sa.primary_track,
      sa.current_level
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN student_abilities sa ON u.id = sa.user_id
    WHERE u.role = 'student' AND u.skills_embedding IS NULL
    LIMIT 100
  `);
    console.log(`找到 ${result.rows.length} 个待处理学生`);
    for (const student of result.rows) {
        try {
            const text = `
        昵称: ${student.nickname || ''}
        学校: ${student.university || ''}
        专业: ${student.major || ''}
        OPC性格标签: ${student.opc_personality_tag || ''}
        OPC标签: ${student.opc_label || ''}
        赛道: ${student.track || student.primary_track || ''}
        等级: A赛道${student.level_a || 0}级, B赛道${student.level_b || 0}级, 当前${student.current_level || 0}级
        能力: 开放性${student.openness || 50}, 坚持性${student.persistence || 50}, 创造性${student.creativity || 50}
      `.trim();
            console.log(`处理学生 ${student.id}: ${student.nickname || 'unknown'}`);
            const embedding = await embeddingService_1.embeddingService.generateEmbedding(text);
            await db_1.pool.query('UPDATE users SET skills_embedding = $1, interests_embedding = $1, profile_embedding = $1 WHERE id = $2', [JSON.stringify(embedding), student.id]);
            console.log(`✓ 学生 ${student.id} embedding已生成`);
        }
        catch (error) {
            console.error(`✗ 学生 ${student.id} 失败:`, error);
        }
    }
    console.log('学生embedding生成完成');
}
async function main() {
    try {
        await generateTaskEmbeddings();
        await generateStudentEmbeddings();
        // 显示统计信息
        const taskStats = await db_1.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(title_embedding) as with_embedding
      FROM tasks
    `);
        const studentStats = await db_1.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(skills_embedding) as with_embedding
      FROM users
      WHERE role = 'student'
    `);
        console.log('\n=== 统计信息 ===');
        console.log(`任务: ${taskStats.rows[0].with_embedding}/${taskStats.rows[0].total} 已生成embedding`);
        console.log(`学生: ${studentStats.rows[0].with_embedding}/${studentStats.rows[0].total} 已生成embedding`);
    }
    catch (error) {
        console.error('生成embedding失败:', error);
        process.exit(1);
    }
    finally {
        await db_1.pool.end();
    }
}
main();
//# sourceMappingURL=generateEmbeddings.js.map