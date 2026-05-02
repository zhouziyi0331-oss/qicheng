"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
async function checkSchema() {
    try {
        const result = await database_1.default.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
        console.log('Users table columns:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkSchema();
//# sourceMappingURL=checkUsersSchema.js.map