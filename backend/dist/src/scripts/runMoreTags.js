"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});
async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🚀 导入更多核心标签...');
        const migrationPath = path.join(__dirname, '../../migrations/201_more_talent_tags.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        await client.query(migrationSQL);
        console.log('✅ 导入成功！');
        const tagCountResult = await client.query('SELECT COUNT(*) as count FROM talent_tags');
        console.log(`\n🏷️  总标签数量: ${tagCountResult.rows[0].count}`);
        const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM talent_tags 
      GROUP BY category 
      ORDER BY category
    `);
        console.log('\n📊 按分类统计:');
        categoryResult.rows.forEach(row => {
            console.log(`  ${row.category}: ${row.count}个`);
        });
    }
    catch (error) {
        console.error('❌ 失败:', error.message);
        throw error;
    }
    finally {
        client.release();
        await pool.end();
    }
}
runMigration()
    .then(() => {
    console.log('\n✨ 完成！');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 失败:', error);
    process.exit(1);
});
//# sourceMappingURL=runMoreTags.js.map