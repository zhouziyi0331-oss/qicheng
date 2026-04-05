import { Pool, PoolClient } from 'pg';
declare const pool: Pool;
/**
 * Execute a query with automatic connection management.
 */
export declare function query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
/**
 * Execute a query returning a single row or null.
 */
export declare function queryOne<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T | null>;
/**
 * Run multiple queries in a transaction.
 */
export declare function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
/**
 * Optimistic lock update for student_balances.
 * Retries up to maxRetries times on version mismatch.
 */
export declare function updateBalanceOptimistic(client: PoolClient, userId: string, delta: number, maxRetries?: number): Promise<void>;
export { pool };
declare const _default: {
    query: typeof query;
    queryOne: typeof queryOne;
    withTransaction: typeof withTransaction;
    updateBalanceOptimistic: typeof updateBalanceOptimistic;
};
export default _default;
//# sourceMappingURL=db.d.ts.map