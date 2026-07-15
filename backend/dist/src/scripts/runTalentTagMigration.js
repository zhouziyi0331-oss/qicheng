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
// 加载环境变量
dotenv.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});
async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🚀 开始运行天赋标签系统迁移...');
        // 读取迁移文件
        const migrationPath = path.join(__dirname, '../../migrations/200_talent_tag_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        console.log('📄 读取迁移文件成功');
        // 执行迁移
        await client.query(migrationSQL);
        console.log('✅ 迁移执行成功！');
        // 验证表是否创建成功
        const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%talent%'
      ORDER BY table_name
    `);
        console.log('\n📊 创建的表:');
        result.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });
        // 查询导入的标签数量
        const tagCountResult = await client.query('SELECT COUNT(*) as count FROM talent_tags');
        console.log(`\n🏷️  导入的标签数量: ${tagCountResult.rows[0].count}`);
        // 显示部分标签
        const tagsResult = await client.query(`
      SELECT tag_name, category, sub_category 
      FROM talent_tags 
      ORDER BY id 
      LIMIT 10
    `);
        console.log('\n📋 示例标签:');
        tagsResult.rows.forEach(tag => {
            console.log(`  • ${tag.tag_name} (${tag.category} - ${tag.sub_category})`);
        });
    }
    catch (error) {
        console.error('❌ 迁移失败:', error.message);
        if (error.position) {
            console.error('错误位置:', error.position);
        }
        throw error;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// 运行
runMigration()
    .then(() => {
    console.log('\n✨ 天赋标签系统初始化完成！');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 初始化失败:', error);
    process.exit(1);
});
//# sourceMappingURL=runTalentTagMigration.js.map