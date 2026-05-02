"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function listTables() {
    try {
        const tables = await db_1.default.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
        console.log('Tables in database:');
        console.log(tables);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
listTables();
//# sourceMappingURL=listTables.js.map