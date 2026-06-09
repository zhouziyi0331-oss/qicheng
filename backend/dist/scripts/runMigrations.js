#!/usr/bin/env ts-node
"use strict";
/**
 * 执行数据库迁移脚本
 * 运行: ts-node scripts/runMigrations.ts
 */
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
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
});
const migrations = [
    '078_level_track_system.sql',
    '079_jump_test_system.sql',
    '080_team_community_system.sql',
    '081_migrate_student_profiles_to_users.sql',
];
async function runMigrations() {
    console.log('🚀 开始执行数据库迁移...\n');
    for (const migration of migrations) {
        const filePath = path.join(__dirname, '..', 'migrations', migration);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ 文件不存在: ${migration}`);
            continue;
        }
        console.log(`📝 执行: ${migration}`);
        try {
            const sql = fs.readFileSync(filePath, 'utf-8');
            await pool.query(sql);
            console.log(`✅ 完成: ${migration}\n`);
        }
        catch (error) {
            console.error(`❌ 错误: ${migration}`);
            console.error(`   ${error.message}\n`);
            // 如果是"已存在"错误，继续执行
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log(`⚠️  表/字段已存在，跳过\n`);
                continue;
            }
            // 其他错误则停止
            throw error;
        }
    }
    console.log('✨ 所有迁移执行完成！');
    await pool.end();
}
// 验证数据
async function verifyData() {
    console.log('\n📊 验证数据完整性...\n');
    try {
        // 检查学生是否都有等级和赛道
        const result1 = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'student' AND (current_level IS NULL OR track IS NULL)`);
        console.log(`学生缺少等级/赛道: ${result1.rows[0].count} (应该为0)`);
        // 检查student_capabilities初始化
        const result2 = await pool.query(`
      SELECT COUNT(*) FROM users u
      LEFT JOIN student_capabilities sc ON u.id = sc.student_id
      WHERE u.role = 'student' AND sc.student_id IS NULL
    `);
        console.log(`学生缺少能力记录: ${result2.rows[0].count} (应该为0)`);
        // 检查等级分布
        const result3 = await pool.query(`
      SELECT track, current_level, COUNT(*) as count
      FROM users
      WHERE role = 'student'
      GROUP BY track, current_level
      ORDER BY track, current_level
    `);
        console.log('\n等级分布:');
        result3.rows.forEach(row => {
            console.log(`  ${row.track} Lv.${row.current_level}: ${row.count}人`);
        });
        // 检查level_configs
        const result4 = await pool.query(`SELECT COUNT(*) FROM level_configs`);
        console.log(`\n等级配置数量: ${result4.rows[0].count} (应该为12)`);
    }
    catch (error) {
        console.error(`❌ 验证错误: ${error.message}`);
    }
    await pool.end();
}
// 主函数
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--verify')) {
        await verifyData();
    }
    else {
        await runMigrations();
        // 迁移完成后自动验证
        if (!args.includes('--no-verify')) {
            await verifyData();
        }
    }
}
main().catch(error => {
    console.error('💥 执行失败:', error);
    process.exit(1);
});
//# sourceMappingURL=runMigrations.js.map