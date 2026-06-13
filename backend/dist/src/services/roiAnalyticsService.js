"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
/**
 * E-17: ROI投入产出看板服务
 * 提供企业投入产出分析和成本对比
 */
class ROIAnalyticsService {
    /**
     * 获取企业ROI看板数据
     */
    async getROIDashboard(companyId, period = 'monthly') {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        // 获取当期统计
        const currentStats = await this.getFinancialStats(companyId, year, month);
        // 获取历史数据
        const months = period === 'monthly' ? 6 : period === 'quarterly' ? 12 : 24;
        const historicalData = await this.getHistoricalStats(companyId, months);
        // 成本对比分析
        const costComparison = await this.generateCostComparison(companyId, currentStats);
        // 效率指标
        const efficiencyMetrics = await this.calculateEfficiencyMetrics(companyId);
        // 生成建议
        const recommendations = this.generateRecommendations(currentStats, costComparison);
        return {
            current_period: currentStats,
            historical_data: historicalData,
            cost_comparison: costComparison,
            efficiency_metrics: efficiencyMetrics,
            recommendations,
        };
    }
    /**
     * 获取月度财务统计
     */
    async getFinancialStats(companyId, year, month) {
        const result = await database_1.pool.query(`SELECT * FROM company_financial_stats
       WHERE company_id = $1 AND year = $2 AND month = $3`, [companyId, year, month]);
        if (result.rows.length === 0) {
            // 返回空统计
            return {
                company_id: companyId,
                year,
                month,
                total_spent: 0,
                platform_fees: 0,
                task_payments: 0,
                tasks_published: 0,
                tasks_completed: 0,
                avg_task_cost: 0,
                estimated_market_cost: 0,
                cost_savings: 0,
                roi_percentage: 0,
                total_task_hours: 0,
            };
        }
        return result.rows[0];
    }
    /**
     * 获取历史统计数据
     */
    async getHistoricalStats(companyId, months) {
        const result = await database_1.pool.query(`SELECT * FROM company_financial_stats
       WHERE company_id = $1
       ORDER BY year DESC, month DESC
       LIMIT $2`, [companyId, months]);
        return result.rows;
    }
    /**
     * 生成成本对比分析
     */
    async generateCostComparison(companyId, currentStats) {
        if (currentStats.tasks_completed === 0) {
            return {
                platform_cost: 0,
                fulltime_cost: 0,
                outsourcing_cost: 0,
                savings_vs_fulltime: 0,
                savings_vs_outsourcing: 0,
            };
        }
        // 获取任务技能分布
        const skillsResult = await database_1.pool.query(`SELECT required_skills, COUNT(*) as count
       FROM tasks
       WHERE company_id = $1
         AND status = 'completed'
         AND EXTRACT(YEAR FROM completed_at) = $2
         AND EXTRACT(MONTH FROM completed_at) = $3
       GROUP BY required_skills`, [companyId, currentStats.year, currentStats.month]);
        // 估算全职雇佣成本
        const fulltimeCost = await this.estimateFulltimeCost(skillsResult.rows, currentStats.total_task_hours || 160);
        // 估算外包成本（通常比平台高30-50%）
        const outsourcingCost = currentStats.total_spent * 1.4;
        // 计算节省
        const savingsVsFulltime = fulltimeCost - currentStats.total_spent;
        const savingsVsOutsourcing = outsourcingCost - currentStats.total_spent;
        return {
            platform_cost: currentStats.total_spent,
            fulltime_cost: fulltimeCost,
            outsourcing_cost: outsourcingCost,
            savings_vs_fulltime: savingsVsFulltime,
            savings_vs_outsourcing: savingsVsOutsourcing,
            roi_vs_fulltime: fulltimeCost > 0 ? (savingsVsFulltime / fulltimeCost) * 100 : 0,
            roi_vs_outsourcing: outsourcingCost > 0 ? (savingsVsOutsourcing / outsourcingCost) * 100 : 0,
        };
    }
    /**
     * 估算全职雇佣成本
     */
    async estimateFulltimeCost(skillDistribution, totalHours) {
        if (skillDistribution.length === 0) {
            // 默认使用中级开发的月薪
            return 15000;
        }
        // 获取平均市场月薪
        const avgMonthlyCost = await database_1.pool.query(`SELECT AVG(fulltime_monthly_cost) as avg_cost
       FROM market_price_benchmarks
       WHERE skill_level = 'intermediate'
         AND valid_to IS NULL`);
        const monthlyCost = parseFloat(avgMonthlyCost.rows[0]?.avg_cost || '15000');
        // 根据工作小时数调整（假设全职是160小时/月）
        const adjustedCost = (totalHours / 160) * monthlyCost;
        return adjustedCost;
    }
    /**
     * 计算效率指标
     */
    async calculateEfficiencyMetrics(companyId) {
        const result = await database_1.pool.query(`SELECT
         COUNT(*) as total_tasks,
         AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600 / 24) as avg_completion_days,
         AVG(client_rating) as avg_rating,
         COUNT(*) FILTER (WHERE client_rating >= 4.5) as high_quality_tasks,
         COUNT(*) FILTER (WHERE completed_at <= deadline) as on_time_tasks
       FROM tasks
       WHERE company_id = $1 AND status = 'completed'`, [companyId]);
        const stats = result.rows[0];
        const totalTasks = parseInt(stats.total_tasks, 10);
        return {
            avg_completion_days: parseFloat(stats.avg_completion_days || '0').toFixed(1),
            avg_rating: parseFloat(stats.avg_rating || '0').toFixed(2),
            high_quality_rate: totalTasks > 0 ? ((stats.high_quality_tasks / totalTasks) * 100).toFixed(1) : 0,
            on_time_rate: totalTasks > 0 ? ((stats.on_time_tasks / totalTasks) * 100).toFixed(1) : 0,
            total_tasks: totalTasks,
        };
    }
    /**
     * 生成建议
     */
    generateRecommendations(stats, costComparison) {
        const recommendations = [];
        // ROI建议
        if (costComparison.savings_vs_fulltime > 0) {
            recommendations.push(`相比雇佣全职员工，本月节省了¥${costComparison.savings_vs_fulltime.toFixed(0)}`);
        }
        // 任务数量建议
        if (stats.tasks_completed < 5) {
            recommendations.push('增加任务发布量可以享受更高的阶梯优惠');
        }
        // 平均成本建议
        if (stats.avg_task_cost > 0) {
            if (stats.avg_task_cost < 1000) {
                recommendations.push('任务平均成本较低，适合高频次使用');
            }
            else if (stats.avg_task_cost > 5000) {
                recommendations.push('可以考虑使用项目制发布，获得更好的成本控制');
            }
        }
        if (recommendations.length === 0) {
            recommendations.push('继续保持良好的任务发布节奏');
        }
        return recommendations;
    }
    /**
     * 创建成本对比分析报告
     */
    async createCostComparisonAnalysis(companyId, period, startDate, endDate) {
        // 获取期间内的任务数据
        const tasksResult = await database_1.pool.query(`SELECT
         COUNT(*) as task_count,
         SUM(budget) as total_cost,
         SUM(estimated_hours) as total_hours
       FROM tasks
       WHERE company_id = $1
         AND status = 'completed'
         AND completed_at BETWEEN $2 AND $3`, [companyId, startDate, endDate]);
        const taskData = tasksResult.rows[0];
        // 生成对比场景
        const fulltimeCost = await this.estimateFulltimeCost([], parseFloat(taskData.total_hours || '0'));
        const outsourcingCost = parseFloat(taskData.total_cost || '0') * 1.4;
        const actualCost = parseFloat(taskData.total_cost || '0');
        const scenarios = {
            fulltime_hire: {
                cost: fulltimeCost,
                description: '雇佣全职员工',
                savings: fulltimeCost - actualCost,
                savings_percentage: fulltimeCost > 0 ? ((fulltimeCost - actualCost) / fulltimeCost) * 100 : 0,
            },
            outsourcing: {
                cost: outsourcingCost,
                description: '外包公司',
                savings: outsourcingCost - actualCost,
                savings_percentage: outsourcingCost > 0 ? ((outsourcingCost - actualCost) / outsourcingCost) * 100 : 0,
            },
        };
        const totalSavings = scenarios.fulltime_hire.savings + scenarios.outsourcing.savings;
        const roiPercentage = actualCost > 0 ? (totalSavings / actualCost) * 100 : 0;
        // 保存分析报告
        const result = await database_1.pool.query(`INSERT INTO cost_comparison_analyses
       (id, company_id, analysis_period, start_date, end_date,
        actual_total_cost, actual_task_count, actual_total_hours,
        comparison_scenarios, total_savings, roi_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`, [
            (0, uuid_1.v4)(),
            companyId,
            period,
            startDate,
            endDate,
            actualCost,
            taskData.task_count,
            taskData.total_hours,
            JSON.stringify(scenarios),
            totalSavings,
            roiPercentage,
        ]);
        return result.rows[0];
    }
    /**
     * 获取市场价格基准
     */
    async getMarketBenchmarks() {
        const result = await database_1.pool.query(`SELECT * FROM market_price_benchmarks
       WHERE valid_to IS NULL OR valid_to > NOW()
       ORDER BY skill_category, skill_level`);
        return result.rows;
    }
    /**
     * 更新财务统计（手动刷新）
     */
    async refreshFinancialStats(companyId, year, month) {
        // 统计该月的任务数据
        const tasksResult = await database_1.pool.query(`SELECT
         COUNT(*) FILTER (WHERE status = 'published') as published,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
         SUM(budget) FILTER (WHERE status = 'completed') as total_spent,
         AVG(budget) FILTER (WHERE status = 'completed') as avg_cost,
         SUM(estimated_hours) FILTER (WHERE status = 'completed') as total_hours
       FROM tasks
       WHERE company_id = $1
         AND EXTRACT(YEAR FROM created_at) = $2
         AND EXTRACT(MONTH FROM created_at) = $3`, [companyId, year, month]);
        const data = tasksResult.rows[0];
        // 估算市场成本
        const estimatedMarketCost = (parseFloat(data.total_spent || '0') * 1.3);
        const costSavings = estimatedMarketCost - parseFloat(data.total_spent || '0');
        const roiPercentage = data.total_spent > 0 ? (costSavings / data.total_spent) * 100 : 0;
        // 更新或插入统计
        await database_1.pool.query(`INSERT INTO company_financial_stats
       (id, company_id, year, month, total_spent, task_payments,
        tasks_published, tasks_completed, tasks_cancelled,
        avg_task_cost, total_task_hours, estimated_market_cost,
        cost_savings, roi_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (company_id, year, month) DO UPDATE
       SET total_spent = EXCLUDED.total_spent,
           task_payments = EXCLUDED.task_payments,
           tasks_published = EXCLUDED.tasks_published,
           tasks_completed = EXCLUDED.tasks_completed,
           tasks_cancelled = EXCLUDED.tasks_cancelled,
           avg_task_cost = EXCLUDED.avg_task_cost,
           total_task_hours = EXCLUDED.total_task_hours,
           estimated_market_cost = EXCLUDED.estimated_market_cost,
           cost_savings = EXCLUDED.cost_savings,
           roi_percentage = EXCLUDED.roi_percentage,
           updated_at = NOW()`, [
            (0, uuid_1.v4)(),
            companyId,
            year,
            month,
            data.total_spent || 0,
            data.total_spent || 0,
            data.published || 0,
            data.completed || 0,
            data.cancelled || 0,
            data.avg_cost || 0,
            data.total_hours || 0,
            estimatedMarketCost,
            costSavings,
            roiPercentage,
        ]);
    }
}
exports.default = new ROIAnalyticsService();
//# sourceMappingURL=roiAnalyticsService.js.map