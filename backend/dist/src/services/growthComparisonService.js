"use strict";
/**
 * Phase 2.3: 成长对比服务
 *
 * 功能：
 * 1. 对比学生入驻时和当前的能力数据
 * 2. 生成成长对比卡片数据
 * 3. 提炼成长亮点
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
class GrowthComparisonService {
    /**
     * 生成成长对比数据
     */
    async generateComparison(studentId) {
        const client = await database_1.pool.connect();
        try {
            // 1. 获取学生基础信息
            const userResult = await client.query(`SELECT
          created_at,
          current_level,
          nickname
         FROM users
         WHERE id = $1`, [studentId]);
            if (userResult.rows.length === 0) {
                throw new Error('学生不存在');
            }
            const user = userResult.rows[0];
            const joinDate = new Date(user.created_at);
            const now = new Date();
            const daysOnPlatform = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
            // 2. 获取能力对比数据
            const abilityComparison = await this.getAbilityComparison(studentId);
            // 3. 获取关键指标对比
            const metrics = await this.getMetricsComparison(studentId);
            // 4. 生成成长亮点
            const highlights = await this.generateHighlights(studentId, abilityComparison, metrics);
            // 5. 生成成长总结
            const summary = this.generateSummary(abilityComparison, metrics);
            logger_1.default.info('[GrowthComparison] 成长对比生成成功', {
                studentId,
                daysOnPlatform,
                totalGrowthScore: summary.totalGrowthScore
            });
            return {
                studentId,
                joinDate: joinDate.toISOString(),
                daysOnPlatform,
                abilityComparison,
                metrics,
                highlights,
                summary
            };
        }
        catch (error) {
            logger_1.default.error('[GrowthComparison] 生成成长对比失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取能力对比数据（六维雷达图）
     */
    async getAbilityComparison(studentId) {
        const client = await database_1.pool.connect();
        try {
            // 获取初始OPC测评结果
            const initialResult = await client.query(`SELECT
          dimension_scores
         FROM opc_v2_user_profiles
         WHERE user_id = $1
         ORDER BY created_at ASC
         LIMIT 1`, [studentId]);
            // 获取当前能力数据（最新的OPC测评或实时计算）
            const currentResult = await client.query(`SELECT
          dimension_scores
         FROM opc_v2_user_profiles
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`, [studentId]);
            if (initialResult.rows.length === 0 || currentResult.rows.length === 0) {
                // 如果没有OPC数据，返回默认值
                return this.getDefaultAbilityComparison();
            }
            const initialScores = initialResult.rows[0].dimension_scores || {};
            const currentScores = currentResult.rows[0].dimension_scores || {};
            // 六个维度
            const dimensions = [
                { key: 'info_processing', label: '信息处理' },
                { key: 'creation_drive', label: '创作驱动' },
                { key: 'task_execution', label: '任务执行' },
                { key: 'collaboration', label: '协作方式' },
                { key: 'risk_attitude', label: '风险态度' },
                { key: 'learning_style', label: '学习风格' }
            ];
            const comparison = dimensions.map(dim => {
                const initial = initialScores[dim.key] || 50;
                const current = currentScores[dim.key] || 50;
                const growth = current - initial;
                const growthPercentage = initial > 0 ? (growth / initial) * 100 : 0;
                return {
                    dimension: dim.label,
                    initialScore: Math.round(initial),
                    currentScore: Math.round(current),
                    growth: Math.round(growth),
                    growthPercentage: Math.round(growthPercentage * 10) / 10
                };
            });
            return comparison;
        }
        catch (error) {
            logger_1.default.error('[GrowthComparison] 获取能力对比失败:', error);
            return this.getDefaultAbilityComparison();
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取关键指标对比
     */
    async getMetricsComparison(studentId) {
        const client = await database_1.pool.connect();
        try {
            const metrics = [];
            // 1. 完成任务数
            const tasksResult = await client.query(`SELECT COUNT(*) as total
         FROM task_submissions
         WHERE student_id = $1 AND status = 'approved'`, [studentId]);
            const completedTasks = parseInt(tasksResult.rows[0]?.total || '0');
            metrics.push({
                metric: 'completed_tasks',
                label: '完成项目',
                initialValue: 0,
                currentValue: completedTasks,
                growth: completedTasks,
                unit: '个'
            });
            // 2. 累计收入
            const earningsResult = await client.query(`SELECT COALESCE(SUM(amount), 0) as total
         FROM earnings
         WHERE student_id = $1`, [studentId]);
            const totalEarnings = parseFloat(earningsResult.rows[0]?.total || '0');
            metrics.push({
                metric: 'earnings',
                label: '累计收入',
                initialValue: 0,
                currentValue: Math.round(totalEarnings),
                growth: Math.round(totalEarnings),
                unit: '元'
            });
            // 3. 平均评分
            const ratingResult = await client.query(`SELECT COALESCE(AVG(final_score), 0) as avg_score,
                COUNT(*) as count
         FROM task_submissions
         WHERE student_id = $1 AND status = 'approved' AND final_score IS NOT NULL`, [studentId]);
            const avgScore = parseFloat(ratingResult.rows[0]?.avg_score || '0');
            const ratingCount = parseInt(ratingResult.rows[0]?.count || '0');
            if (ratingCount > 0) {
                metrics.push({
                    metric: 'avg_rating',
                    label: '平均评分',
                    initialValue: 3.0,
                    currentValue: Math.round(avgScore * 10) / 10,
                    growth: Math.round((avgScore - 3.0) * 10) / 10,
                    unit: '分'
                });
            }
            // 4. 掌握技能数
            const skillsResult = await client.query(`SELECT COUNT(*) as total
         FROM student_abilities
         WHERE student_id = $1 AND current_level >= 2`, [studentId]);
            const masteredSkills = parseInt(skillsResult.rows[0]?.total || '0');
            metrics.push({
                metric: 'skills',
                label: '掌握技能',
                initialValue: 0,
                currentValue: masteredSkills,
                growth: masteredSkills,
                unit: '项'
            });
            // 5. 当前等级
            const levelResult = await client.query(`SELECT current_level FROM users WHERE id = $1`, [studentId]);
            const currentLevel = parseInt(levelResult.rows[0]?.current_level || '1');
            metrics.push({
                metric: 'level',
                label: '当前等级',
                initialValue: 1,
                currentValue: currentLevel,
                growth: currentLevel - 1,
                unit: '级'
            });
            return metrics;
        }
        catch (error) {
            logger_1.default.error('[GrowthComparison] 获取指标对比失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 生成成长亮点
     */
    async generateHighlights(studentId, abilityComparison, metrics) {
        const highlights = [];
        // 1. 找出增长最快的能力
        const fastestGrowingAbility = abilityComparison
            .filter(a => a.growth > 5)
            .sort((a, b) => b.growth - a.growth)[0];
        if (fastestGrowingAbility) {
            highlights.push({
                type: 'ability',
                title: `${fastestGrowingAbility.dimension}突破`,
                description: `从${fastestGrowingAbility.initialScore}分提升到${fastestGrowingAbility.currentScore}分，增长${fastestGrowingAbility.growth}分`,
                icon: '📈'
            });
        }
        // 2. 任务完成里程碑
        const tasksMetric = metrics.find(m => m.metric === 'completed_tasks');
        if (tasksMetric && tasksMetric.currentValue >= 10) {
            highlights.push({
                type: 'achievement',
                title: '任务达人',
                description: `已完成${tasksMetric.currentValue}个项目，积累丰富实战经验`,
                icon: '🏆'
            });
        }
        // 3. 收入里程碑
        const earningsMetric = metrics.find(m => m.metric === 'earnings');
        if (earningsMetric && earningsMetric.currentValue >= 1000) {
            const milestones = [50000, 20000, 10000, 5000, 1000];
            const milestone = milestones.find(m => earningsMetric.currentValue >= m);
            if (milestone) {
                highlights.push({
                    type: 'milestone',
                    title: `收入突破${milestone >= 10000 ? milestone / 10000 + '万' : milestone}元`,
                    description: `累计赚取${earningsMetric.currentValue}元，能力变现成功`,
                    icon: '💰'
                });
            }
        }
        // 4. 评分优秀
        const ratingMetric = metrics.find(m => m.metric === 'avg_rating');
        if (ratingMetric && ratingMetric.currentValue >= 4.5) {
            highlights.push({
                type: 'achievement',
                title: '品质保证',
                description: `平均评分${ratingMetric.currentValue}分，获得客户高度认可`,
                icon: '⭐'
            });
        }
        // 5. 等级提升
        const levelMetric = metrics.find(m => m.metric === 'level');
        if (levelMetric && levelMetric.currentValue >= 3) {
            highlights.push({
                type: 'milestone',
                title: `晋升至Lv.${levelMetric.currentValue}`,
                description: `从新手成长为${this.getLevelName(levelMetric.currentValue)}`,
                icon: '🎖️'
            });
        }
        return highlights.slice(0, 4); // 最多返回4个亮点
    }
    /**
     * 生成成长总结
     */
    generateSummary(abilityComparison, metrics) {
        // 计算总成长分数
        const abilityGrowthScore = abilityComparison.reduce((sum, a) => sum + Math.max(a.growth, 0), 0);
        const tasksMetric = metrics.find(m => m.metric === 'completed_tasks');
        const tasksScore = (tasksMetric?.currentValue || 0) * 10;
        const totalGrowthScore = Math.round(abilityGrowthScore + tasksScore);
        // 找出增长最快的能力
        const fastest = abilityComparison
            .filter(a => a.growth > 0)
            .sort((a, b) => b.growth - a.growth)[0];
        const fastestGrowingAbility = fastest ? fastest.dimension : '暂无';
        // 关键成就
        const earningsMetric = metrics.find(m => m.metric === 'earnings');
        const levelMetric = metrics.find(m => m.metric === 'level');
        let keyAchievement = '开始成长之旅';
        if (earningsMetric && earningsMetric.currentValue >= 10000) {
            keyAchievement = `累计收入突破${Math.floor(earningsMetric.currentValue / 10000)}万元`;
        }
        else if (tasksMetric && tasksMetric.currentValue >= 20) {
            keyAchievement = `完成${tasksMetric.currentValue}个项目`;
        }
        else if (levelMetric && levelMetric.currentValue >= 3) {
            keyAchievement = `晋升至Lv.${levelMetric.currentValue}`;
        }
        return {
            totalGrowthScore,
            fastestGrowingAbility,
            keyAchievement
        };
    }
    /**
     * 获取等级名称
     */
    getLevelName(level) {
        const levelNames = {
            1: '试流者',
            2: '探路者',
            3: '专业者',
            4: '精通者',
            5: '大师'
        };
        return levelNames[level] || `Lv.${level}`;
    }
    /**
     * 默认能力对比数据
     */
    getDefaultAbilityComparison() {
        const dimensions = ['信息处理', '创作驱动', '任务执行', '协作方式', '风险态度', '学习风格'];
        return dimensions.map(dim => ({
            dimension: dim,
            initialScore: 50,
            currentScore: 50,
            growth: 0,
            growthPercentage: 0
        }));
    }
}
exports.default = new GrowthComparisonService();
//# sourceMappingURL=growthComparisonService.js.map