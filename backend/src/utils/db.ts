import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../../config';
import logger from './logger';

export { QueryResult };

const pool = new Pool({
  connectionString: config.db.url,
  min: config.db.pool.min,
  max: config.db.pool.max,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

/**
 * Execute a query with automatic connection management.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
  return res.rows as T[];
}

/**
 * Execute a query returning a single row or null.
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Run multiple queries in a transaction.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Optimistic lock update for student_balances.
 * Retries up to maxRetries times on version mismatch.
 */
export async function updateBalanceOptimistic(
  client: PoolClient,
  userId: string,
  delta: number,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const balanceRow = await client.query(
      'SELECT balance, version FROM student_balances WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    if (balanceRow.rows.length === 0) {
      throw new Error(`Balance record not found for user ${userId}`);
    }
    const { balance, version } = balanceRow.rows[0];
    const newBalance = parseFloat(balance) + delta;
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
    const updateResult = await client.query(
      `UPDATE student_balances
       SET balance = $1, version = version + 1, updated_at = NOW()
       WHERE user_id = $2 AND version = $3`,
      [newBalance, userId, version]
    );
    if (updateResult.rowCount === 1) return; // success
    // version mismatch — retry
  }
  throw new Error('Balance update failed after max retries (concurrent modification)');
}

export { pool };
export default { query, queryOne, withTransaction, updateBalanceOptimistic };
