"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function listMatchTables() {
    try {
        const result = await db_1.default.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%match%'
      ORDER BY table_name
    `);
        console.log('Tables with "match" in name:');
        console.log('Result:', JSON.stringify(result, null, 2));
        if (Array.isArray(result)) {
            result.forEach((row) => console.log('  -', row.table_name));
        }
        else if (result.rows) {
            result.rows.forEach((row) => console.log('  -', row.table_name));
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
listMatchTables();
//# sourceMappingURL=listMatchTables.js.map