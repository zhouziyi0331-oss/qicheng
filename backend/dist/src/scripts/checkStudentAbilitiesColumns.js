"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkStudentAbilitiesColumns() {
    try {
        const result = await db_1.default.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'student_abilities'
      ORDER BY ordinal_position
    `);
        console.log('student_abilities表字段：');
        result.forEach((row) => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
        // 查看实际数据
        const data = await db_1.default.query(`
      SELECT sa.*, u.nickname
      FROM student_abilities sa
      JOIN users u ON sa.user_id = u.id
      LIMIT 3
    `);
        console.log('\n学生能力数据示例：');
        data.forEach((row) => {
            console.log(`\n学生: ${row.nickname}`);
            console.log(`  等级: ${row.current_level}`);
            console.log(`  主赛道: ${row.primary_track}`);
            console.log(`  完成任务数: ${row.total_completed_tasks}`);
            console.log(`  总分: ${row.total_score}`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}
checkStudentAbilitiesColumns();
//# sourceMappingURL=checkStudentAbilitiesColumns.js.map