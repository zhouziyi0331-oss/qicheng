"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkSchema() {
    try {
        const columns = await db_1.default.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'student_attributes'
      ORDER BY ordinal_position;
    `);
        console.log('student_attributes table columns:');
        console.log(columns);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkSchema();
//# sourceMappingURL=checkStudentAttributes.js.map