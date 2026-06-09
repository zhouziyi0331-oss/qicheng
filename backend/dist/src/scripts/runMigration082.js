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
/**
 * 运行082迁移：学生成长数据闭环系统
 */
async function runMigration() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
    });
    try {
        console.log('🚀 开始执行迁移: 082_student_growth_data_loop.sql\n');
        console.log('📡 连接数据库...');
        // 读取迁移文件
        const migrationPath = path.join(__dirname, '../../migrations/082_student_growth_data_loop.sql');
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`迁移文件不存在: ${migrationPath}`);
        }
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`📄 读取迁移文件成功 (${sql.length} 字符)\n`);
        console.log('⏳ 执行迁移...\n');
        // 执行迁移
        await pool.query(sql);
        console.log('✅ 迁移执行成功！\n');
        // 验证结果
        console.log('🔍 验证迁移结果...\n');
        // 检查新表
        const tables = ['ability_dimension_history', 'growth_summary_cache', 'graduation_report_payments'];
        for (const table of tables) {
            const result = await pool.query(`SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        )`, [table]);
            const exists = result.rows[0].exists;
            console.log(`  ${exists ? '✅' : '❌'} 表 ${table}: ${exists ? '已创建' : '未找到'}`);
        }
        // 检查视图
        const viewResult = await pool.query(`SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'student_growth_overview'
      )`);
        const viewExists = viewResult.rows[0].exists;
        console.log(`  ${viewExists ? '✅' : '❌'} 视图 student_growth_overview: ${viewExists ? '已创建' : '未找到'}`);
        console.log('\n🎉 学生成长数据闭环系统 Migration 完成！');
        console.log('\n已添加：');
        console.log('  - 3个新表：ability_dimension_history, growth_summary_cache, graduation_report_payments');
        console.log('  - 扩展现有表：mentor_growth_observations, user_ability_profiles, growth_reports');
        console.log('  - 1个视图：student_growth_overview');
        console.log('\n下一步：运行测试数据生成脚本');
        console.log('  npx ts-node src/scripts/generateTestData.ts');
    }
    catch (error) {
        console.error('❌ 迁移失败:', error.message);
        if (error.stack) {
            console.error('\n错误堆栈:', error.stack);
        }
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
runMigration();
//# sourceMappingURL=runMigration082.js.map