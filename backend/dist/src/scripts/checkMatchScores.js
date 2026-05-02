"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkMatchScores() {
    try {
        const result = await db_1.default.query(`
      SELECT
        am.task_id,
        am.student_id,
        u.nickname,
        aml.rule_based_score as rule_score,
        aml.vector_similarity as ai_score,
        aml.final_score
      FROM ai_matches am
      JOIN ai_match_logs aml ON am.task_id = aml.task_id AND am.student_id = aml.student_id
      LEFT JOIN users u ON am.student_id = u.id
      ORDER BY aml.final_score DESC
      LIMIT 10
    `);
        console.log('匹配分数详情：');
        console.log('=====================================');
        result.forEach((row) => {
            console.log(`学生: ${row.nickname || row.student_id}`);
            console.log(`  规则评分: ${row.rule_score}`);
            console.log(`  AI相似度: ${(row.ai_score * 100).toFixed(2)}`);
            console.log(`  最终分数: ${row.final_score}`);
            console.log('-------------------------------------');
        });
        process.exit(0);
    }
    catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}
checkMatchScores();
//# sourceMappingURL=checkMatchScores.js.map