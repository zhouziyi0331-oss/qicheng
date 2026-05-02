"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkLevels() {
    try {
        const taskResult = await db_1.default.query('SELECT id, title, level FROM tasks WHERE id = $1', ['9a4ede4a-8560-4dcc-b3ca-25eaaebfdbf2']);
        console.log('Task:', taskResult[0]);
        const studentsResult = await db_1.default.query(`SELECT u.id, u.nickname, sa.current_level
       FROM users u
       JOIN student_abilities sa ON u.id = sa.user_id
       WHERE u.role = $1`, ['student']);
        console.log('\nStudents:');
        studentsResult.forEach((s) => {
            console.log(`  - ${s.nickname || 'unnamed'}: level ${s.current_level}`);
        });
        const taskLevel = taskResult[0]?.level;
        console.log(`\nFiltering logic: student.current_level <= ${taskLevel} + 1 = ${taskLevel + 1}`);
        console.log('Matching students:');
        studentsResult.forEach((s) => {
            const matches = s.current_level <= taskLevel + 1;
            console.log(`  - ${s.nickname || 'unnamed'} (level ${s.current_level}): ${matches ? '✅' : '❌'}`);
        });
    }
    catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}
checkLevels();
//# sourceMappingURL=checkLevels.js.map