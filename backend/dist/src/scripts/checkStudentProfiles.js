"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkStudentProfiles() {
    try {
        const result = await db_1.default.query(`
      SELECT
        u.id,
        u.nickname,
        u.bio,
        u.skills,
        u.interests,
        sa.primary_track,
        sa.current_level,
        sa.openness,
        sa.persistence,
        sa.creativity
      FROM users u
      LEFT JOIN student_abilities sa ON u.id = sa.user_id
      WHERE u.role = 'student'
      ORDER BY u.created_at
    `);
        console.log('学生档案数据：');
        console.log('=====================================');
        result.forEach((row) => {
            console.log(`学生ID: ${row.id}`);
            console.log(`昵称: ${row.nickname || '无'}`);
            console.log(`简介: ${row.bio || '无'}`);
            console.log(`技能: ${row.skills || '无'}`);
            console.log(`兴趣: ${row.interests || '无'}`);
            console.log(`赛道: ${row.primary_track || '无'}`);
            console.log(`等级: ${row.current_level}`);
            console.log(`能力: 开放性=${row.openness}, 坚持性=${row.persistence}, 创造力=${row.creativity}`);
            console.log('-------------------------------------');
        });
        process.exit(0);
    }
    catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}
checkStudentProfiles();
//# sourceMappingURL=checkStudentProfiles.js.map