"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-13: 阶梯优惠服务
 * 根据月度任务数自动享受折扣
 */
class TieredDiscountService {
    /**
     * 获取所有折扣阶梯
     */
    async getAllTiers() {
        const result = await database_1.pool.query(`SELECT * FROM discount_tiers WHERE is_active = true ORDER BY tier_level ASC`);
        return result.rows;
    }
    /**
     * 获取企业当前阶梯信息
     */
    async getCompanyTierInfo(companyId) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        // 调用数据库函数计算阶梯
        const result = await database_1.pool.query(`SELECT * FROM calculate_company_tier($1, $2, $3)`, [companyId, year, month]);
        if (result.rows.length === 0) {
            // 返回默认值
            return {
                tier_level: 0,
                tier_name: '新手',
                discount_rate: 0,
                tasks_count: 0,
                next_tier_threshold: 5,
                tasks_to_next: 5,
                current_tier: null,
                next_tier: null,
            };
        }
        const tierInfo = result.rows[0];
        // 获取完整的阶梯信息
        const [currentTierResult, nextTierResult] = await Promise.all([
            database_1.pool.query(`SELECT * FROM discount_tiers WHERE tier_level = $1`, [tierInfo.tier_level]),
            tierInfo.next_tier_threshold
                ? database_1.pool.query(`SELECT * FROM discount_tiers
             WHERE is_active = true AND tier_level > $1
             ORDER BY tier_level ASC LIMIT 1`, [tierInfo.tier_level])
                : Promise.resolve({ rows: [] }),
        ]);
        return {
            tier_level: tierInfo.tier_level,
            tier_name: tierInfo.tier_name,
            discount_rate: parseFloat(tierInfo.discount_rate),
            tasks_count: tierInfo.tasks_count,
            next_tier_threshold: tierInfo.next_tier_threshold || null,
            tasks_to_next: tierInfo.tasks_to_next || null,
            current_tier: currentTierResult.rows[0] || null,
            next_tier: nextTierResult.rows[0] || null,
        };
    }
    /**
     * 获取企业月度统计
     */
    async getMonthlyStats(companyId, year, month) {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || now.getMonth() + 1;
        const result = await database_1.pool.query(`SELECT * FROM company_monthly_stats
       WHERE company_id = $1 AND year = $2 AND month = $3`, [companyId, targetYear, targetMonth]);
        if (result.rows.length === 0) {
            // 返回空统计
            return {
                company_id: companyId,
                year: targetYear,
                month: targetMonth,
                tasks_published: 0,
                tasks_completed: 0,
                total_spent: 0,
                total_saved: 0,
                current_tier_level: 0,
                current_discount_rate: 0,
            };
        }
        return result.rows[0];
    }
    /**
     * 计算折扣金额
     */
    async calculateDiscount(companyId, originalAmount) {
        const tierInfo = await this.getCompanyTierInfo(companyId);
        if (!tierInfo.current_tier) {
            // 没有折扣
            return {
                tier_level: 0,
                discount_rate: 0,
                original_amount: originalAmount,
                discount_amount: 0,
                final_amount: originalAmount,
                service_fee_rate: 0.05,
            };
        }
        const discountAmount = originalAmount * tierInfo.current_tier.discount_rate;
        const finalAmount = originalAmount - discountAmount;
        return {
            tier_level: tierInfo.tier_level,
            discount_rate: tierInfo.current_tier.discount_rate,
            original_amount: originalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            service_fee_rate: tierInfo.current_tier.service_fee_rate,
        };
    }
    /**
     * 应用折扣到任务
     */
    async applyDiscountToTask(taskId, companyId, originalAmount) {
        const discount = await this.calculateDiscount(companyId, originalAmount);
        // 记录折扣应用
        const result = await database_1.pool.query(`INSERT INTO discount_applications
       (id, task_id, company_id, tier_level, discount_rate,
        original_amount, discount_amount, final_amount, calculation_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            taskId,
            companyId,
            discount.tier_level,
            discount.discount_rate,
            discount.original_amount,
            discount.discount_amount,
            discount.final_amount,
            JSON.stringify(discount),
        ]);
        // 更新月度统计的节省金额
        const now = new Date();
        await database_1.pool.query(`UPDATE company_monthly_stats
       SET total_saved = total_saved + $1,
           updated_at = NOW()
       WHERE company_id = $2 AND year = $3 AND month = $4`, [discount.discount_amount, companyId, now.getFullYear(), now.getMonth() + 1]);
        return result.rows[0];
    }
    /**
     * 获取企业折扣历史
     */
    async getDiscountHistory(companyId, limit = 20, offset = 0) {
        const [applicationsResult, countResult] = await Promise.all([
            database_1.pool.query(`SELECT da.*, t.title as task_title
         FROM discount_applications da
         JOIN tasks t ON da.task_id = t.id
         WHERE da.company_id = $1
         ORDER BY da.applied_at DESC
         LIMIT $2 OFFSET $3`, [companyId, limit, offset]),
            database_1.pool.query(`SELECT COUNT(*) FROM discount_applications WHERE company_id = $1`, [companyId]),
        ]);
        return {
            applications: applicationsResult.rows,
            total: parseInt(countResult.rows[0].count, 10),
        };
    }
    /**
     * 获取企业历史月度统计
     */
    async getHistoricalStats(companyId, months = 6) {
        const result = await database_1.pool.query(`SELECT * FROM company_monthly_stats
       WHERE company_id = $1
       ORDER BY year DESC, month DESC
       LIMIT $2`, [companyId, months]);
        return result.rows;
    }
    /**
     * 获取企业折扣进度（用于UI展示）
     */
    async getDiscountProgress(companyId) {
        const tierInfo = await this.getCompanyTierInfo(companyId);
        const monthlyStats = await this.getMonthlyStats(companyId);
        const allTiers = await this.getAllTiers();
        return {
            current: {
                tier: tierInfo.current_tier,
                tasks_published: tierInfo.tasks_count,
            },
            next: {
                tier: tierInfo.next_tier,
                tasks_needed: tierInfo.tasks_to_next,
                threshold: tierInfo.next_tier_threshold,
            },
            monthly_stats: monthlyStats,
            all_tiers: allTiers,
            progress_percentage: tierInfo.next_tier_threshold
                ? Math.min(100, (tierInfo.tasks_count / tierInfo.next_tier_threshold) * 100)
                : 100,
        };
    }
    /**
     * 手动更新月度统计（用于修正数据）
     */
    async refreshMonthlyStats(companyId, year, month) {
        // 统计该月的任务数
        const tasksResult = await database_1.pool.query(`SELECT
         COUNT(*) FILTER (WHERE status = 'published') as published,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
       FROM tasks
       WHERE company_id = $1
         AND EXTRACT(YEAR FROM created_at) = $2
         AND EXTRACT(MONTH FROM created_at) = $3`, [companyId, year, month]);
        const stats = tasksResult.rows[0];
        // 更新或插入统计
        await database_1.pool.query(`INSERT INTO company_monthly_stats
       (id, company_id, year, month, tasks_published, tasks_completed, tasks_cancelled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (company_id, year, month) DO UPDATE
       SET tasks_published = EXCLUDED.tasks_published,
           tasks_completed = EXCLUDED.tasks_completed,
           tasks_cancelled = EXCLUDED.tasks_cancelled,
           updated_at = NOW()`, [
            (0, uuid_1.v4)(),
            companyId,
            year,
            month,
            stats.published || 0,
            stats.completed || 0,
            stats.cancelled || 0,
        ]);
        // 重新计算阶梯信息
        const tierInfo = await this.getCompanyTierInfo(companyId);
        // 更新当前阶梯
        await database_1.pool.query(`UPDATE company_monthly_stats
       SET current_tier_level = $1,
           current_discount_rate = $2,
           next_tier_level = $3,
           next_tier_threshold = $4,
           tasks_to_next_tier = $5
       WHERE company_id = $6 AND year = $7 AND month = $8`, [
            tierInfo.tier_level,
            tierInfo.discount_rate,
            tierInfo.next_tier ? tierInfo.next_tier.tier_level : null,
            tierInfo.next_tier_threshold,
            tierInfo.tasks_to_next,
            companyId,
            year,
            month,
        ]);
    }
}
exports.default = new TieredDiscountService();
//# sourceMappingURL=tieredDiscountService.js.map