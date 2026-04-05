"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.queryOne = queryOne;
exports.withTransaction = withTransaction;
exports.updateBalanceOptimistic = updateBalanceOptimistic;
const pg_1 = require("pg");
const config_1 = require("../../config");
const logger_1 = __importDefault(require("./logger"));
const pool = new pg_1.Pool({
    connectionString: config_1.config.db.url,
    min: config_1.config.db.pool.min,
    max: config_1.config.db.pool.max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
exports.pool = pool;
pool.on('error', (err) => {
    logger_1.default.error('Unexpected database pool error', { error: err.message });
});
pool.on('connect', () => {
    logger_1.default.debug('New database connection established');
});
/**
 * Execute a query with automatic connection management.
 */
async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger_1.default.debug('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
    return res.rows;
}
/**
 * Execute a query returning a single row or null.
 */
async function queryOne(text, params) {
    const rows = await query(text, params);
    return rows[0] ?? null;
}
/**
 * Run multiple queries in a transaction.
 */
async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
/**
 * Optimistic lock update for student_balances.
 * Retries up to maxRetries times on version mismatch.
 */
async function updateBalanceOptimistic(client, userId, delta, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const balanceRow = await client.query('SELECT balance, version FROM student_balances WHERE user_id = $1 FOR UPDATE', [userId]);
        if (balanceRow.rows.length === 0) {
            throw new Error(`Balance record not found for user ${userId}`);
        }
        const { balance, version } = balanceRow.rows[0];
        const newBalance = parseFloat(balance) + delta;
        if (newBalance < 0) {
            throw new Error('Insufficient balance');
        }
        const updateResult = await client.query(`UPDATE student_balances
       SET balance = $1, version = version + 1, updated_at = NOW()
       WHERE user_id = $2 AND version = $3`, [newBalance, userId, version]);
        if (updateResult.rowCount === 1)
            return; // success
        // version mismatch — retry
    }
    throw new Error('Balance update failed after max retries (concurrent modification)');
}
exports.default = { query, queryOne, withTransaction, updateBalanceOptimistic };
//# sourceMappingURL=db.js.map