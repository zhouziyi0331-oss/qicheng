"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = require("../config/database");
const config_1 = require("../../config");
const uuid_1 = require("uuid");
const anthropic = new sdk_1.default({
    apiKey: config_1.config.anthropicApiKey
});
/**
 * 资产可视化服务
 * 实现个人资产仪表盘、成长对比卡片、升级通关仪式
 */
class AssetVisualizationService {
    /**
     * 获取个人资产仪表盘数据
     */
    async getDashboard(studentId) {
        const client = await database_1.pool.connect();
        try {
            // 1. 获取基础信息
            const userResult = await client.query(`SELECT
           id,
           nickname,
           current_opc_personality,
           current_opc_level
         FROM users
         WHERE id = $1`, [studentId]);
            if (userResult.rows.length === 0) {
                throw new Error('用户不存在');
            }
            const user = userResult.rows[0];
            // 2. 获取能力估值汇总
            const valuationResult = await client.query(`SELECT * FROM student_valuation_summary WHERE student_id = $1`, [studentId]);
            const valuation = valuationResult.rows[0] || {
                total_skills: 0,
                total_valuation: 0,
                total_tasks: 0,
                overall_rating: 0
            };
            // 3. 获取能力拆解
            const skillsResult = await client.query(`SELECT
           ssp.skill_name,
           ssp.mastery_level,
           ssp.completed_tasks_count,
           ssp.average_rating,
           sv.market_avg_price
         FROM student_skill_profiles ssp
         LEFT JOIN skill_valuations sv ON ssp.skill_name = sv.skill_name
         WHERE ssp.student_id = $1
         ORDER BY ssp.completed_tasks_count DESC
         LIMIT 5`, [studentId]);
            // 4. 获取累计数据
            const statsResult = await client.query(`SELECT
           COUNT(*) FILTER (WHERE status = 'completed') as total_completed_tasks
         FROM task_assignments
         WHERE student_id = $1`, [studentId]);
            const stats = statsResult.rows[0];
            // 简化：收入数据暂时用模拟值（实际应该从payments或orders表获取）
            const estimatedEarnings = parseInt(stats.total_completed_tasks || 0) * 350; // 平均每单350元
            // 5. 获取卡点统计
            const stuckResult = await client.query(`SELECT
           COUNT(*) as total_stuck_count,
           COUNT(*) FILTER (WHERE resolved = true) as resolved_count
         FROM student_stuck_points
         WHERE student_id = $1`, [studentId]);
            const stuckStats = stuckResult.rows[0];
            // 6. 获取使用过的工具数量（简化：从任务描述中提取）
            const toolsCount = 7; // 简化处理，实际应该从任务记录中统计
            return {
                currentLevel: `Lv.${user.current_opc_level || 1}`,
                levelLabel: this.getLevelLabel(user.current_opc_level || 1),
                skillValuation: parseFloat(valuation.total_valuation || 0),
                skillValuationMessage: `你的${skillsResult.rows.length}项能力，市场月薪估值约 ¥${Math.round(parseFloat(valuation.total_valuation || 0)).toLocaleString()}`,
                skills: skillsResult.rows.map(skill => ({
                    name: skill.skill_name,
                    masteryLevel: skill.mastery_level,
                    masteryLabel: this.getMasteryLabel(skill.mastery_level),
                    completedTasks: parseInt(skill.completed_tasks_count),
                    averageRating: parseFloat(skill.average_rating || 0).toFixed(1),
                    marketValue: skill.market_avg_price ? `¥${skill.market_avg_price}-${skill.market_avg_price * 1.2}/单` : '软技能'
                })),
                cumulativeStats: {
                    totalCompletedTasks: parseInt(stats.total_completed_tasks || 0),
                    totalEarnings: estimatedEarnings,
                    totalStuckCount: parseInt(stuckStats.total_stuck_count || 0),
                    resolvedStuckCount: parseInt(stuckStats.resolved_count || 0),
                    toolsUsedCount: toolsCount
                }
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 生成成长对比卡片
     */
    async generateGrowthComparisonCard(studentId, triggerType, currentTaskId) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 1. 获取第1单数据
            const firstTaskResult = await client.query(`SELECT
           ta.id,
           ta.task_id,
           ta.accepted_at,
           ta.submitted_at,
           EXTRACT(EPOCH FROM (ta.submitted_at - ta.accepted_at))/86400 as duration_days,
           (SELECT COUNT(*) FROM student_stuck_points WHERE task_id = ta.task_id AND student_id = ta.student_id) as stuck_count,
           (SELECT stuck_description FROM student_stuck_points WHERE task_id = ta.task_id AND student_id = ta.student_id ORDER BY created_at LIMIT 1) as main_stuck
         FROM task_assignments ta
         WHERE ta.student_id = $1
           AND ta.status = 'completed'
         ORDER BY ta.accepted_at ASC
         LIMIT 1`, [studentId]);
            if (firstTaskResult.rows.length === 0) {
                throw new Error('未找到完成的任务');
            }
            const firstTask = firstTaskResult.rows[0];
            // 2. 获取当前单数据
            const currentTaskResult = await client.query(`SELECT
           ta.id,
           ta.task_id,
           ta.accepted_at,
           ta.submitted_at,
           EXTRACT(EPOCH FROM (ta.submitted_at - ta.accepted_at))/86400 as duration_days,
           (SELECT COUNT(*) FROM student_stuck_points WHERE task_id = ta.task_id AND student_id = ta.student_id) as stuck_count
         FROM task_assignments ta
         WHERE ta.student_id = $1
           AND ta.status = 'completed'
         ORDER BY ta.submitted_at DESC
         LIMIT 1`, [studentId]);
            const currentTask = currentTaskResult.rows[0];
            // 3. 构建对比数据
            const comparisonData = {
                firstTask: {
                    durationDays: Math.ceil(parseFloat(firstTask.duration_days)),
                    stuckCount: parseInt(firstTask.stuck_count),
                    mainFear: firstTask.main_stuck || '不知道配色对不对'
                },
                currentTask: {
                    durationDays: Math.ceil(parseFloat(currentTask.duration_days)),
                    stuckCount: parseInt(currentTask.stuck_count)
                }
            };
            // 4. 使用AI生成对比文案
            const comparisonMessage = await this.generateComparisonMessage(comparisonData);
            // 5. 保存卡片记录
            const cardId = (0, uuid_1.v4)();
            await client.query(`INSERT INTO growth_comparison_cards (
          id, student_id, trigger_type, trigger_task_id,
          first_task_data, current_task_data, comparison_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                cardId,
                studentId,
                triggerType,
                currentTaskId,
                JSON.stringify(comparisonData.firstTask),
                JSON.stringify(comparisonData.currentTask),
                comparisonMessage
            ]);
            await client.query('COMMIT');
            return {
                cardId,
                firstTask: comparisonData.firstTask,
                currentTask: comparisonData.currentTask,
                comparisonMessage,
                improvement: {
                    durationImprovement: comparisonData.firstTask.durationDays - comparisonData.currentTask.durationDays,
                    stuckImprovement: comparisonData.firstTask.stuckCount - comparisonData.currentTask.stuckCount
                }
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 生成升级仪式数据
     */
    async generateLevelUpCeremony(studentId, fromLevel, toLevel) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // 1. 获取学生成长数据
            const growthDataResult = await client.query(`SELECT
           -- 第1单数据（简化：使用completed_at）
           (SELECT EXTRACT(EPOCH FROM (completed_at - accepted_at))/86400
            FROM task_assignments
            WHERE student_id = $1 AND status = 'completed' AND completed_at IS NOT NULL
            ORDER BY accepted_at ASC LIMIT 1) as first_task_days,

           -- 最近3单平均耗时
           (SELECT AVG(EXTRACT(EPOCH FROM (completed_at - accepted_at))/86400)
            FROM (
              SELECT * FROM task_assignments
              WHERE student_id = $1 AND status = 'completed' AND completed_at IS NOT NULL
              ORDER BY completed_at DESC LIMIT 3
            ) recent) as recent_avg_days,

           -- 总完成订单
           (SELECT COUNT(*) FROM task_assignments WHERE student_id = $1 AND status = 'completed') as total_orders
        `, [studentId]);
            const growthData = growthDataResult.rows[0];
            // 简化：第1单卡点数用模拟值（实际task_assignments表中没有直接关联）
            const firstStuckCount = 0;
            // 2. 使用AI生成导师专属留言
            const mentorMessage = await this.generateMentorLevelUpMessage({
                fromLevel,
                toLevel,
                firstTaskDays: Math.ceil(parseFloat(growthData.first_task_days || 7)),
                firstStuckCount: firstStuckCount,
                recentAvgDays: Math.ceil(parseFloat(growthData.recent_avg_days || 3)),
                totalOrders: parseInt(growthData.total_orders || 0)
            });
            // 3. 获取解锁能力
            const unlockedAbilities = this.getUnlockedAbilities(toLevel);
            const nextLevelRequirements = this.getNextLevelRequirements(toLevel);
            // 4. 保存升级事件
            const eventId = (0, uuid_1.v4)();
            await client.query(`INSERT INTO level_up_events (
          id, student_id, from_level, to_level,
          mentor_personal_message, unlocked_abilities, next_level_requirements
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                eventId,
                studentId,
                fromLevel,
                toLevel,
                mentorMessage,
                JSON.stringify(unlockedAbilities),
                JSON.stringify(nextLevelRequirements)
            ]);
            await client.query('COMMIT');
            return {
                eventId,
                fromLevel,
                toLevel,
                toLevelLabel: this.getLevelLabel(toLevel),
                mentorMessage,
                unlockedAbilities,
                nextLevelRequirements
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * AI生成成长对比文案
     */
    async generateComparisonMessage(data) {
        const prompt = `你是启程平台的AI导师。根据学生的成长数据，生成一句温暖的对比文案。

**成长数据**：
第1单：耗时${data.firstTask.durationDays}天，卡住${data.firstTask.stuckCount}次，最怕"${data.firstTask.mainFear}"
当前单：耗时${data.currentTask.durationDays}天，卡住${data.currentTask.stuckCount}次

**要求**：
1. 一句话（50-80字）
2. 让学生看到自己的进步
3. 具体指出变化（如"你在XX上完全不需要问了"）
4. 禁止用"你真棒""继续加油"

**格式示例**：
"你在配色上完全不需要问了——你还记得第1单卡了3次吗？"

现在请生成文案，只输出文案内容，不要其他内容。`;
        try {
            const response = await anthropic.messages.create({
                model: 'claude-opus-4-20250514',
                max_tokens: 200,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type === 'text') {
                return content.text.trim();
            }
            return '你的成长速度挺稳的——从第1单到现在，进步看得见。';
        }
        catch (error) {
            logger_1.default.error('AI生成对比文案失败:', error);
            return `第1单你花了${data.firstTask.durationDays}天，卡了${data.firstTask.stuckCount}次。这一单你花了${data.currentTask.durationDays}天，${data.currentTask.stuckCount}次卡住。`;
        }
    }
    /**
     * AI生成导师升级留言
     */
    async generateMentorLevelUpMessage(data) {
        const prompt = `你是启程平台的AI导师。学生刚从Lv.${data.fromLevel}升到Lv.${data.toLevel}。

**学生数据**：
- 第1单耗时：${data.firstTaskDays}天，卡了${data.firstStuckCount}次
- 最近3单平均耗时：${data.recentAvgDays}天
- 总完成订单：${data.totalOrders}单

**你的任务**：生成一段导师专属留言（100-150字），包含：
1. 引用具体数据展示成长
2. 预测下一级大概需要多久
3. 告诉学生Lv.${data.toLevel + 1}可以做什么任务

**格式示例**：
"你升到Lv.2了。我翻了一下你的记录——第1单你卡了3次，后面几单几乎不需要我了。按这个速度，Lv.3你大概1个月就能到。到了Lv.3，你就可以接品牌矩阵类的任务了，那才是你真正该去的地方。"

**禁止**："恭喜""继续加油"

现在请生成留言，只输出留言内容。`;
        try {
            const response = await anthropic.messages.create({
                model: 'claude-opus-4-20250514',
                max_tokens: 300,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type === 'text') {
                return content.text.trim();
            }
            return `你升到Lv.${data.toLevel}了。从记录看，你的进步很稳。继续这个节奏，下一级不远了。`;
        }
        catch (error) {
            logger_1.default.error('AI生成导师留言失败:', error);
            return `你升到Lv.${data.toLevel}了。第1单你花了${data.firstTaskDays}天，最近平均${data.recentAvgDays}天就能完成一单。按这个速度，Lv.${data.toLevel + 1}大概${Math.ceil((data.toLevel + 1 - data.toLevel) * 15)}天就能到。`;
        }
    }
    /**
     * 获取等级标签
     */
    getLevelLabel(level) {
        const labels = {
            1: '新手',
            2: '实践者',
            3: '熟练者',
            4: '专业者',
            5: '专家'
        };
        return labels[level] || '进阶者';
    }
    /**
     * 获取熟练度标签
     */
    getMasteryLabel(mastery) {
        const labels = {
            beginner: '入门',
            intermediate: '中级',
            proficient: '熟练',
            expert: '精通'
        };
        return labels[mastery] || '入门';
    }
    /**
     * 获取等级解锁能力
     */
    getUnlockedAbilities(level) {
        const abilities = {
            2: ['可以接品牌视觉类任务', '可以查看高级教程'],
            3: ['可以接品牌矩阵类任务', '可以申请导师认证'],
            4: ['可以接企业定制项目', '可以开设工作室'],
            5: ['可以接跨国项目', '可以成为平台合伙人']
        };
        return abilities[level] || ['解锁新任务类型'];
    }
    /**
     * 获取下一级要求
     */
    getNextLevelRequirements(currentLevel) {
        return {
            tasksNeeded: (currentLevel + 1) * 5,
            earningsNeeded: (currentLevel + 1) * 2000,
            skillsNeeded: Math.ceil((currentLevel + 1) / 2)
        };
    }
}
exports.default = new AssetVisualizationService();
//# sourceMappingURL=assetVisualizationService.js.map