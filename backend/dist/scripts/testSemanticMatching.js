"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
const semanticMatchingEngine_1 = __importDefault(require("../src/services/semanticMatchingEngine"));
const vectorGenerationService_1 = __importDefault(require("../src/services/vectorGenerationService"));
const qichengTeacherService_1 = __importDefault(require("../src/services/qichengTeacherService"));
async function testSemanticMatching() {
    console.log('=== 启程平台语义匹配系统测试 ===\n');
    try {
        // 1. 检查表结构
        console.log('1. 检查数据库表结构...');
        const tables = await db_1.pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND (tablename = 'student_capabilities'
           OR tablename = 'task_student_matches'
           OR tablename = 'task_translations')
      ORDER BY tablename
    `);
        console.log('✅ 相关表存在:', tables.rows.map((r) => r.tablename).join(', '));
        // 2. 检查现有任务
        console.log('\n2. 查找测试任务...');
        const tasks = await db_1.pool.query(`
      SELECT id, title, status
      FROM tasks
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 3
    `);
        if (tasks.rows.length === 0) {
            console.log('❌ 没有找到开放状态的任务');
            return;
        }
        const testTask = tasks.rows[0];
        console.log(`✅ 找到测试任务: ${testTask.title} (ID: ${testTask.id})`);
        // 3. 检查现有学生
        console.log('\n3. 查找测试学生...');
        const students = await db_1.pool.query(`
      SELECT u.id, u.nickname, u.role
      FROM users u
      WHERE u.role = 'student'
      LIMIT 5
    `);
        if (students.rows.length === 0) {
            console.log('❌ 没有找到学生用户');
            return;
        }
        console.log(`✅ 找到 ${students.rows.length} 个学生用户`);
        students.rows.forEach((s) => {
            console.log(`   - ${s.nickname} (ID: ${s.id})`);
        });
        // 4. 测试向量生成（任务）
        console.log('\n4. 测试任务向量生成...');
        try {
            await vectorGenerationService_1.default.updateTaskEmbedding(testTask.id);
            console.log('✅ 任务向量生成成功');
        }
        catch (error) {
            console.log('⚠️  任务向量生成失败:', error.message);
        }
        // 5. 测试学生向量生成
        console.log('\n5. 测试学生向量生成...');
        const testStudent = students.rows[0];
        try {
            await vectorGenerationService_1.default.updateStudentEmbedding(testStudent.id);
            console.log(`✅ 学生向量生成成功: ${testStudent.nickname}`);
        }
        catch (error) {
            console.log('⚠️  学生向量生成失败:', error.message);
        }
        // 6. 测试任务翻译
        console.log('\n6. 测试启程老师翻译服务...');
        try {
            await qichengTeacherService_1.default.analyzeAndTranslateTask(testTask.id);
            const translation = await db_1.pool.query(`SELECT student_friendly_title, difficulty_overall, learning_value
         FROM task_translations
         WHERE task_id = $1`, [testTask.id]);
            if (translation.rows.length > 0) {
                const t = translation.rows[0];
                console.log('✅ 任务翻译成功:');
                console.log(`   学生友好标题: ${t.student_friendly_title}`);
                console.log(`   难度评分: ${t.difficulty_overall}/10`);
                console.log(`   学习价值: ${t.learning_value}`);
            }
        }
        catch (error) {
            console.log('⚠️  任务翻译失败:', error.message);
        }
        // 7. 测试匹配算法
        console.log('\n7. 测试语义匹配引擎...');
        try {
            const matchScore = await semanticMatchingEngine_1.default.matchTaskWithStudent(testTask.id, testStudent.id);
            console.log('✅ 匹配计算成功:');
            console.log(`   综合得分: ${(matchScore.overallScore * 100).toFixed(1)}%`);
            console.log(`   技能匹配: ${(matchScore.skillMatch.score * 100).toFixed(1)}%`);
            console.log(`   难度匹配: ${(matchScore.difficultyMatch.score * 100).toFixed(1)}%`);
            console.log(`   领域匹配: ${(matchScore.domainMatch.score * 100).toFixed(1)}%`);
            console.log(`   成长潜力: ${(matchScore.growthPotential.score * 100).toFixed(1)}%`);
            console.log(`   可靠性: ${(matchScore.reliability.score * 100).toFixed(1)}%`);
            console.log(`   偏好对齐: ${(matchScore.preferenceAlignment.score * 100).toFixed(1)}%`);
        }
        catch (error) {
            console.log('⚠️  匹配计算失败:', error.message);
        }
        // 8. 测试批量匹配
        console.log('\n8. 测试批量匹配（找出Top 5学生）...');
        try {
            const topMatches = await semanticMatchingEngine_1.default.findBestStudentsForTask(testTask.id, 5);
            console.log(`✅ 找到 ${topMatches.length} 个匹配学生:`);
            topMatches.forEach((match, index) => {
                console.log(`   ${index + 1}. 学生ID: ${match.studentId.substring(0, 8)}... - 匹配度: ${(match.matchScore.overallScore * 100).toFixed(1)}%`);
            });
        }
        catch (error) {
            console.log('⚠️  批量匹配失败:', error.message);
        }
        // 9. 检查匹配记录
        console.log('\n9. 检查匹配记录表...');
        const matchRecords = await db_1.pool.query(`
      SELECT COUNT(*) as count,
             MAX(overall_score) as max_score,
             AVG(overall_score) as avg_score
      FROM task_student_matches
      WHERE task_id = $1
    `, [testTask.id]);
        const stats = matchRecords.rows[0];
        console.log(`✅ 匹配记录统计:`);
        console.log(`   总记录数: ${stats.count}`);
        console.log(`   最高分: ${(stats.max_score * 100).toFixed(1)}%`);
        console.log(`   平均分: ${(stats.avg_score * 100).toFixed(1)}%`);
        console.log('\n=== 测试完成 ===');
    }
    catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error(error.stack);
    }
    finally {
        await db_1.pool.end();
    }
}
testSemanticMatching();
//# sourceMappingURL=testSemanticMatching.js.map