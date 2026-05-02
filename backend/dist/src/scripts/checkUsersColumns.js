"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkUsersColumns() {
    try {
        const result = await db_1.default.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
        console.log('users表字段：');
        result.forEach((row) => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}
checkUsersColumns();
//# sourceMappingURL=checkUsersColumns.js.map