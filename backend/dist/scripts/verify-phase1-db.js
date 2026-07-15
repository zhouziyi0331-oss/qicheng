"use strict";
/**
 * Phase 1 功能数据库验证脚本
 * 检查必需的表和字段是否存在
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/config/database");
async function verifyDatabase() {
    console.log('========================================');
    console.log('Phase 1 数据库结构验证');
    console.log('========================================\n');
    try {
        // 1. 检查 user_opc_results 表
        console.log('【检查1】user_opc_results 表');
        console.log('----------------------------------------');
        try {
            const result = await database_1.pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user_opc_results'
        ORDER BY ordinal_position
      `);
            if (result.rows.length > 0) {
                console.log('✓ 表存在，字段列表:');
                result.rows.forEach(row => {
                    console.log(`  - ${row.column_name}: ${row.data_type}`);
                });
                // 检查数据量
                const countResult = await database_1.pool.query('SELECT COUNT(*) FROM user_opc_results');
                console.log(`✓ 数据行数: ${countResult.rows[0].count}`);
                // 检查人格标签分布
                const tagDistribution = await database_1.pool.query(`
          SELECT personality_tag, COUNT(*) as count
          FROM user_opc_results
          GROUP BY personality_tag
          ORDER BY count DESC
        `);
                console.log('✓ 人格标签分布:');
                tagDistribution.rows.forEach(row => {
                    console.log(`  - ${row.personality_tag}: ${row.count}人`);
                });
            }
            else {
                console.log('✗ 表不存在或无字段');
            }
        }
        catch (error) {
            console.log('✗ 错误:', error.message);
        }
        console.log('');
        // 2. 检查 users 表
        console.log('【检查2】users 表');
        console.log('----------------------------------------');
        try {
            const result = await database_1.pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name IN ('id', 'level', 'task_count', 'username')
        ORDER BY ordinal_position
      `);
            if (result.rows.length > 0) {
                console.log('✓ 关键字段存在:');
                result.rows.forEach(row => {
                    console.log(`  - ${row.column_name}: ${row.data_type}`);
                });
                // 检查等级分布
                const levelDistribution = await database_1.pool.query(`
          SELECT level, COUNT(*) as count
          FROM users
          GROUP BY level
          ORDER BY level
        `);
                console.log('✓ 用户等级分布:');
                levelDistribution.rows.forEach(row => {
                    console.log(`  - Lv.${row.level}: ${row.count}人`);
                });
            }
            else {
                console.log('✗ 关键字段缺失');
            }
        }
        catch (error) {
            console.log('✗ 错误:', error.message);
        }
        console.log('');
        // 3. 检查 orders/task_assignments 表
        console.log('【检查3】任务/订单表');
        console.log('----------------------------------------');
        try {
            // 尝试 orders 表
            const ordersCheck = await database_1.pool.query(`
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_name = 'orders'
      `);
            if (ordersCheck.rows[0].count > 0) {
                console.log('✓ orders 表存在');
                const completedCount = await database_1.pool.query(`
          SELECT COUNT(*) FROM orders WHERE status = 'completed'
        `);
                console.log(`✓ 已完成订单数: ${completedCount.rows[0].count}`);
            }
            else {
                // 尝试 task_assignments 表
                const taskCheck = await database_1.pool.query(`
          SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name = 'task_assignments'
        `);
                if (taskCheck.rows[0].count > 0) {
                    console.log('✓ task_assignments 表存在');
                    const completedCount = await database_1.pool.query(`
            SELECT COUNT(*) FROM task_assignments WHERE status = 'completed'
          `);
                    console.log(`✓ 已完成任务数: ${completedCount.rows[0].count}`);
                }
                else {
                    console.log('✗ orders 和 task_assignments 表都不存在');
                }
            }
        }
        catch (error) {
            console.log('✗ 错误:', error.message);
        }
        console.log('');
        // 4. 检查 mentor_observations 表
        console.log('【检查4】mentor_observations 表');
        console.log('----------------------------------------');
        try {
            const result = await database_1.pool.query(`
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_name = 'mentor_observations'
      `);
            if (result.rows[0].count > 0) {
                console.log('✓ 表存在');
                // 检查突破记录
                const breakthroughCount = await database_1.pool.query(`
          SELECT COUNT(*) FROM mentor_observations
          WHERE observation_type = 'breakthrough'
        `);
                console.log(`✓ 突破记录数: ${breakthroughCount.rows[0].count}`);
            }
            else {
                console.log('✗ 表不存在（升级功能需要此表）');
            }
        }
        catch (error) {
            console.log('✗ 错误:', error.message);
        }
        console.log('');
        // 5. 测试统计查询
        console.log('【检查5】测试统计查询');
        console.log('----------------------------------------');
        try {
            const testTag = 'system_builder';
            const statResult = await database_1.pool.query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM user_opc_results
        WHERE personality_tag = $1
      `, [testTag]);
            console.log(`✓ 查询成功: ${testTag} 有 ${statResult.rows[0].count} 人`);
        }
        catch (error) {
            console.log('✗ 查询失败:', error.message);
        }
        console.log('');
        console.log('========================================');
        console.log('验证完成');
        console.log('========================================');
    }
    catch (error) {
        console.error('验证过程出错:', error);
    }
    finally {
        await database_1.pool.end();
    }
}
verifyDatabase();
//# sourceMappingURL=verify-phase1-db.js.map