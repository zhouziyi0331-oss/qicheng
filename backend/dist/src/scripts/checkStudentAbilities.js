"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkStudentAbilities() {
    try {
        // Check student_abilities structure
        const columns = await db_1.default.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'student_abilities'
      ORDER BY ordinal_position
    `);
        console.log('student_abilities columns:');
        console.log(columns);
        // Check if we have data
        const data = await db_1.default.query(`
      SELECT * FROM student_abilities LIMIT 3
    `);
        console.log('\nSample data:');
        console.log(data);
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkStudentAbilities();
//# sourceMappingURL=checkStudentAbilities.js.map