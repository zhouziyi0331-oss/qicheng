"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
async function analyzeSlowQueries() {
    logger_1.default.info('=== 分析数据库慢查询 ===\n');
    // 检查是否启用了pg_stat_statements扩展
    const extensionCheck = await db_1.pool.query(`
    SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements'
  `);
    if (extensionCheck.rows.length === 0) {
        logger_1.default.info('⚠️  pg_stat_statements扩展未启用，无法分析慢查询');
        logger_1.default.info('建议运行: CREATE EXTENSION pg_stat_statements;\n');
    }
    else {
        // 查询最慢的10个查询
        const slowQueries = await db_1.pool.query(`
      SELECT
        substring(query, 1, 100) as query_preview,
        calls,
        total_exec_time::numeric(10,2) as total_time_ms,
        mean_exec_time::numeric(10,2) as avg_time_ms,
        max_exec_time::numeric(10,2) as max_time_ms
      FROM pg_stat_statements
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);
        logger_1.default.info('📊 最慢的10个查询:');
        slowQueries.rows.forEach((row, i) => {
            logger_1.default.info(`\n${i + 1}. ${row.query_preview}...`);
            logger_1.default.info(`   调用次数: ${row.calls}`);
            logger_1.default.info(`   平均耗时: ${row.avg_time_ms}ms`);
            logger_1.default.info(`   最大耗时: ${row.max_time_ms}ms`);
            logger_1.default.info(`   总耗时: ${row.total_time_ms}ms`);
        });
    }
}
async function analyzeTableSizes() {
    logger_1.default.info('\n\n=== 数据库表大小分析 ===\n');
    const tableSizes = await db_1.pool.query(`
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
    LIMIT 20
  `);
    logger_1.default.info('📦 前20个最大的表:');
    tableSizes.rows.forEach((row, i) => {
        logger_1.default.info(`${i + 1}. ${row.tablename}: ${row.size}`);
    });
}
async function analyzeIndexUsage() {
    logger_1.default.info('\n\n=== 索引使用情况分析 ===\n');
    // 查找未使用的索引
    const unusedIndexes = await db_1.pool.query(`
    SELECT
      schemaname,
      relname as tablename,
      indexrelname as indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
      AND indexrelname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexrelid) DESC
    LIMIT 10
  `);
    if (unusedIndexes.rows.length > 0) {
        logger_1.default.info('⚠️  未使用的索引（可能需要删除）:');
        unusedIndexes.rows.forEach((row, i) => {
            logger_1.default.info(`${i + 1}. ${row.tablename}.${row.indexname} (${row.index_size})`);
        });
    }
    else {
        logger_1.default.info('✅ 所有索引都在使用中');
    }
    // 查找缺失索引的表（频繁全表扫描）
    const missingIndexes = await db_1.pool.query(`
    SELECT
      schemaname,
      relname as tablename,
      seq_scan,
      seq_tup_read,
      idx_scan,
      CASE WHEN seq_scan > 0 THEN seq_tup_read / seq_scan ELSE 0 END as avg_seq_tup_read
    FROM pg_stat_user_tables
    WHERE seq_scan > 0
    ORDER BY seq_tup_read DESC
    LIMIT 10
  `);
    logger_1.default.info('\n📈 频繁全表扫描的表（可能需要添加索引）:');
    missingIndexes.rows.forEach((row, i) => {
        logger_1.default.info(`${i + 1}. ${row.tablename}:`);
        logger_1.default.info(`   全表扫描次数: ${row.seq_scan}`);
        logger_1.default.info(`   索引扫描次数: ${row.idx_scan || 0}`);
        logger_1.default.info(`   平均扫描行数: ${Math.round(row.avg_seq_tup_read)}`);
    });
}
async function analyzeConnectionPool() {
    logger_1.default.info('\n\n=== 数据库连接池状态 ===\n');
    const connections = await db_1.pool.query(`
    SELECT
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle,
      count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
    FROM pg_stat_activity
    WHERE datname = current_database()
  `);
    const conn = connections.rows[0];
    logger_1.default.info(`总连接数: ${conn.total_connections}`);
    logger_1.default.info(`活跃连接: ${conn.active}`);
    logger_1.default.info(`空闲连接: ${conn.idle}`);
    logger_1.default.info(`事务中空闲: ${conn.idle_in_transaction}`);
    if (parseInt(conn.idle_in_transaction) > 0) {
        logger_1.default.info('\n⚠️  警告: 存在事务中空闲的连接，可能导致锁等待');
    }
}
async function analyzeDataStats() {
    logger_1.default.info('\n\n=== 数据统计 ===\n');
    const stats = await db_1.pool.query(`
    SELECT
      (SELECT COUNT(*) FROM tasks) as total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'active') as active_tasks,
      (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
      (SELECT COUNT(*) FROM users WHERE role = 'company') as total_companies,
      (SELECT COUNT(*) FROM tasks WHERE title_embedding IS NOT NULL) as tasks_with_embedding,
      (SELECT COUNT(*) FROM users WHERE role = 'student' AND skills_embedding IS NOT NULL) as students_with_embedding
  `);
    const data = stats.rows[0];
    logger_1.default.info(`任务总数: ${data.total_tasks}`);
    logger_1.default.info(`活跃任务: ${data.active_tasks}`);
    logger_1.default.info(`学生总数: ${data.total_students}`);
    logger_1.default.info(`企业总数: ${data.total_companies}`);
    logger_1.default.info(`已生成embedding的任务: ${data.tasks_with_embedding}/${data.total_tasks} (${Math.round(data.tasks_with_embedding / data.total_tasks * 100)}%)`);
    logger_1.default.info(`已生成embedding的学生: ${data.students_with_embedding}/${data.total_students} (${Math.round(data.students_with_embedding / data.total_students * 100)}%)`);
}
async function main() {
    try {
        await analyzeDataStats();
        await analyzeTableSizes();
        await analyzeConnectionPool();
        await analyzeIndexUsage();
        await analyzeSlowQueries();
        logger_1.default.info('\n\n=== 性能优化建议 ===\n');
        logger_1.default.info('1. 如果发现慢查询，考虑添加索引或优化查询逻辑');
        logger_1.default.info('2. 删除未使用的索引以减少写入开销');
        logger_1.default.info('3. 对于频繁全表扫描的表，添加合适的索引');
        logger_1.default.info('4. 监控连接池状态，避免连接泄漏');
        logger_1.default.info('5. 定期运行 VACUUM ANALYZE 优化表统计信息');
    }
    catch (error) {
        logger_1.default.error('性能分析失败:', error);
        process.exit(1);
    }
    finally {
        await db_1.pool.end();
    }
}
main();
//# sourceMappingURL=analyzePerformance.js.map