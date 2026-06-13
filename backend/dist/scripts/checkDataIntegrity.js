#!/usr/bin/env node
"use strict";
/**
 * 数据真实性与一致性检查
 *
 * 目的：确保数据库中的数据是真实的、完整的、关联正确的
 * 在上线前必须运行，确保前端展示的数据有真实来源
 */
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkDataIntegrity() {
    console.log('\n========================================');
    console.log('🔍 启程平台数据真实性检查');
    console.log('========================================\n');
    let issueCount = 0;
    try {
        // 1. 检查 user_opc_results 是否每个学生都有画像
        console.log('【检查1】OPC测评完整性\n');
        const opcCheck = await db_1.pool.query(`
      SELECT
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT uor.user_id) as students_with_opc,
        COUNT(DISTINCT u.id) - COUNT(DISTINCT uor.user_id) as missing_opc
      FROM users u
      LEFT JOIN user_opc_results uor ON u.id = uor.user_id
      WHERE u.role = 'student'
    `);
        const { total_students, students_with_opc, missing_opc } = opcCheck.rows[0];
        console.log(`  总学生数: ${total_students}`);
        console.log(`  有OPC数据: ${students_with_opc}`);
        console.log(`  缺失OPC: ${missing_opc}`);
        if (parseInt(missing_opc) > 0) {
            console.log(`  ⚠️  警告: ${missing_opc}个学生缺少OPC测评数据\n`);
            issueCount++;
        }
        else {
            console.log(`  ✅ 通过\n`);
        }
        // 2. 检查 student_capabilities 是否都有AI生成的向量
        console.log('【检查2】学生能力向量完整性\n');
        const vectorCheck = await db_1.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN combined_vector IS NOT NULL THEN 1 END) as has_vector,
        COUNT(CASE WHEN profile_summary IS NULL OR profile_summary = '' THEN 1 END) as missing_summary
      FROM student_capabilities
    `);
        const { total, has_vector, missing_summary } = vectorCheck.rows[0];
        console.log(`  总记录数: ${total}`);
        console.log(`  有向量: ${has_vector}`);
        console.log(`  缺失画像摘要: ${missing_summary}`);
        if (parseInt(missing_summary) > 0) {
            console.log(`  ⚠️  警告: ${missing_summary}个学生缺少AI生成的profile_summary\n`);
            issueCount++;
        }
        else {
            console.log(`  ✅ 通过\n`);
        }
        // 3. 检查 task_student_matches 的分数是否合理
        console.log('【检查3】任务匹配分数合理性\n');
        const matchScoreCheck = await db_1.pool.query(`
      SELECT
        COUNT(*) as total_matches,
        COUNT(CASE WHEN overall_score IS NULL OR overall_score < 0 OR overall_score > 1 THEN 1 END) as invalid_scores,
        ROUND(AVG(overall_score)::numeric, 2) as avg_score,
        ROUND(MIN(overall_score)::numeric, 2) as min_score,
        ROUND(MAX(overall_score)::numeric, 2) as max_score
      FROM task_student_matches
    `);
        const matchStats = matchScoreCheck.rows[0];
        console.log(`  总匹配记录: ${matchStats.total_matches}`);
        console.log(`  无效分数: ${matchStats.invalid_scores}`);
        console.log(`  平均分: ${matchStats.avg_score}`);
        console.log(`  分数范围: ${matchStats.min_score} - ${matchStats.max_score}`);
        if (parseInt(matchStats.invalid_scores) > 0) {
            console.log(`  ❌ 错误: ${matchStats.invalid_scores}条匹配记录分数无效\n`);
            issueCount++;
        }
        else {
            console.log(`  ✅ 通过\n`);
        }
        // 4. 检查 mentor_sessions 是否有空消息
        console.log('【检查4】导师对话消息完整性\n');
        const messageCheck = await db_1.pool.query(`
      SELECT
        COUNT(*) as total_messages,
        COUNT(CASE WHEN message IS NULL OR message = '' THEN 1 END) as empty_messages,
        COUNT(CASE WHEN sender = 'mentor' THEN 1 END) as mentor_messages
      FROM mentor_sessions
    `);
        const msgStats = messageCheck.rows[0];
        console.log(`  总消息数: ${msgStats.total_messages}`);
        console.log(`  空消息: ${msgStats.empty_messages}`);
        console.log(`  导师消息: ${msgStats.mentor_messages}`);
        if (parseInt(msgStats.empty_messages) > 0) {
            console.log(`  ⚠️  警告: ${msgStats.empty_messages}条消息为空\n`);
            issueCount++;
        }
        else {
            console.log(`  ✅ 通过\n`);
        }
        // 5. 检查人格标签分布是否真实（不应该所有人都是同一个标签）
        console.log('【检查5】人格标签分布合理性\n');
        const tagDistribution = await db_1.pool.query(`
      SELECT
        personality_tag,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
      FROM user_opc_results
      GROUP BY personality_tag
      ORDER BY count DESC
    `);
        console.log('  人格标签分布:');
        tagDistribution.rows.forEach(row => {
            console.log(`    ${row.personality_tag}: ${row.count}人 (${row.percentage}%)`);
        });
        // 检查是否某个标签占比超过80%（可能是数据造假）
        const maxPercentage = Math.max(...tagDistribution.rows.map(r => parseFloat(r.percentage)));
        if (maxPercentage > 80) {
            console.log(`  ⚠️  警告: 某个标签占比${maxPercentage}%，可能不真实\n`);
            issueCount++;
        }
        else {
            console.log(`  ✅ 通过\n`);
        }
        // 6. 检查是否有"12,843"这样的可疑固定数字（在文案字段中）
        console.log('【检查6】查找可疑固定数字\n');
        const suspiciousNumbers = await db_1.pool.query(`
      SELECT 'mentor_sessions' as table_name, COUNT(*) as count
      FROM mentor_sessions
      WHERE message LIKE '%12,843%' OR message LIKE '%12843%'
      UNION ALL
      SELECT 'growth_reports', COUNT(*)
      FROM growth_reports
      WHERE content_json::text LIKE '%12,843%' OR content_json::text LIKE '%12843%'
    `);
        let foundSuspicious = false;
        suspiciousNumbers.rows.forEach(row => {
            if (parseInt(row.count) > 0) {
                console.log(`  ⚠️  在${row.table_name}表中发现${row.count}条包含"12,843"的记录`);
                foundSuspicious = true;
                issueCount++;
            }
        });
        if (!foundSuspicious) {
            console.log(`  ✅ 未发现可疑固定数字\n`);
        }
        else {
            console.log('');
        }
        // 7. 检查task_translations是否有真实的AI生成内容
        console.log('【检查7】任务翻译内容真实性\n');
        const translationCheck = await db_1.pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN student_friendly_title IS NULL OR student_friendly_title = '' THEN 1 END) as empty_title,
        COUNT(CASE WHEN what_you_will_do IS NULL OR what_you_will_do = '' THEN 1 END) as empty_what_to_do
      FROM task_translations
    `);
        const transStats = translationCheck.rows[0];
        console.log(`  总翻译记录: ${transStats.total}`);
        console.log(`  缺失标题: ${transStats.empty_title}`);
        console.log(`  缺失"你需要做什么": ${transStats.empty_what_to_do}`);
        if (parseInt(transStats.empty_title) > 0 || parseInt(transStats.empty_what_to_do) > 0) {
            console.log(`  ⚠️  警告: 有翻译记录内容不完整\n`);
            issueCount++;
        }
        else {
            console.log(`  ✅ 通过\n`);
        }
        // 总结
        console.log('========================================');
        if (issueCount === 0) {
            console.log('✅ 所有检查通过！数据真实性验证成功。');
        }
        else {
            console.log(`⚠️  发现 ${issueCount} 个问题，请修复后再上线。`);
        }
        console.log('========================================\n');
    }
    catch (error) {
        console.error('❌ 检查失败:', error);
    }
    finally {
        await db_1.pool.end();
    }
}
checkDataIntegrity();
//# sourceMappingURL=checkDataIntegrity.js.map