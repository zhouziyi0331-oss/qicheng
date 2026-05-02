"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
async function checkStudentEmbeddings() {
    try {
        const result = await db_1.default.query(`
      SELECT
        id,
        nickname,
        profile_embedding IS NOT NULL as has_embedding
      FROM users
      WHERE role = $1
      LIMIT 10
    `, ['student']);
        console.log('Query result:', result);
        console.log('Students embeddings:');
        console.log(result.rows);
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
checkStudentEmbeddings();
//# sourceMappingURL=checkStudentEmbeddings.js.map