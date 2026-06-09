"use strict";
/**
 * 即时成长总结服务
 * 模块一：每次项目完成后的即时成长总结
 *
 * 功能：
 * 1. 订单完成后自动触发
 * 2. 读取学生画像、导师对话、成长观察等数据
 * 3. 调用AI生成300-500字的成长总结
 * 4. 存储到 growth_summary_cache 表
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const database_1 = require("../config/database");
class InstantGrowthSummaryService {
    constructor() {
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
    }
    /**
     * 生成即时成长总结（订单完成后触发）
     */
    async generateInstantSummary(orderId) {
        console.log(`[即时成长总结] 开始生成订单 ${orderId} 的成长总结`);
        // 1. 收集数据
        const data = await this.collectData(orderId);
        // 2. 检查缓存
        const cached = await this.checkCache(orderId);
        if (cached) {
            console.log(`[即时成长总结] 使用缓存的总结`);
            return cached;
        }
        // 3. 调用AI生成总结
        const summary = await this.callAI(data);
        // 4. 存储到缓存
        await this.saveToCache(orderId, data.order.student_id, summary);
        // 5. 更新 mentor_growth_observations 表
        await this.updateGrowthObservation(orderId, summary);
        console.log(`[即时成长总结] 生成完成`);
        return summary;
    }
    /**
     * 收集生成总结所需的所有数据
     */
    async collectData(orderId) {
        const client = await database_1.pool.connect();
        try {
            // 1. 获取订单信息
            const orderResult = await client.query(`SELECT id, title, student_price, time_spent_hours, client_rating, completed_at, student_id
         FROM orders WHERE id = $1`, [orderId]);
            if (orderResult.rows.length === 0) {
                throw new Error(`订单 ${orderId} 不存在`);
            }
            const order = orderResult.rows[0];
            // 2. 获取学生初始画像（version = 1）
            const initialProfileResult = await client.query(`SELECT * FROM user_ability_profiles
         WHERE user_id = $1 AND version = 1
         ORDER BY created_at ASC LIMIT 1`, [order.student_id]);
            const initialProfile = initialProfileResult.rows[0];
            // 3. 获取学生当前画像（is_current = true）
            const currentProfileResult = await client.query(`SELECT * FROM user_ability_profiles
         WHERE user_id = $1 AND is_current = true
         LIMIT 1`, [order.student_id]);
            const currentProfile = currentProfileResult.rows[0];
            // 4. 获取本次订单的导师对话记录
            const mentorSessionsResult = await client.query(`SELECT session_summary, key_insights, stuck_points
         FROM mentor_sessions
         WHERE student_id = $1 AND order_id = $2
         ORDER BY created_at DESC`, [order.student_id, orderId]);
            const mentorSessions = mentorSessionsResult.rows;
            // 5. 获取本次订单的成长观察
            const growthObservationsResult = await client.query(`SELECT observation_type, observation_content, skills_observed
         FROM mentor_growth_observations
         WHERE student_id = $1 AND order_id = $2
         ORDER BY created_at DESC`, [order.student_id, orderId]);
            const growthObservations = growthObservationsResult.rows;
            // 6. 获取历史订单统计
            const historyResult = await client.query(`SELECT
           COUNT(*) as total_orders,
           AVG(client_rating) as avg_rating,
           SUM(student_price) as total_earnings
         FROM orders
         WHERE student_id = $1 AND status = 'completed' AND id != $2`, [order.student_id, orderId]);
            const history = historyResult.rows[0];
            return {
                order,
                initialProfile,
                currentProfile,
                mentorSessions,
                growthObservations,
                history,
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 检查是否已有缓存的总结
     */
    async checkCache(orderId) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT summary_json FROM growth_summary_cache WHERE order_id = $1`, [orderId]);
            if (result.rows.length > 0) {
                return result.rows[0].summary_json;
            }
            return null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 调用AI生成总结（严格按照技术规格）
     */
    async callAI(data, retryCount = 0) {
        const startTime = Date.now();
        // 构建System Prompt - 强制要求引用真实数据
        const systemPrompt = `你是启程平台的AI成长导师，负责为学生生成即时成长总结。

【硬性要求】
1. 总字数必须达到300-500字
2. 必须提到本次项目的真实名称
3. 必须引用学生初入平台时的真实状态
4. 必须引用本次任务中的真实卡点
5. 必须引用导师观察中的具体技能
6. 禁止使用"你做得很好""继续加油""未来可期"等空话

【输出格式】
生成三个段落，每段100-150字：

段落一：本次任务概述 + 对比初入平台时的状态
- 必须提到项目名称
- 必须对比初始画像中的具体描述

段落二：本次最大卡点是什么 + 怎么解决的
- 必须引用导师观察或对话中记录的真实卡点
- 必须说明具体的解决方法

段落三：本次展示的具体技能 + 下一步建议
- 必须列出3-5个具体技能
- 建议必须具体可操作

输出JSON格式：
{
  "headline": "一句话标题（15字以内）",
  "paragraph_1": "段落一内容（100-150字）",
  "paragraph_2": "段落二内容（100-150字）",
  "paragraph_3": "段落三内容（100-150字）",
  "skills_demonstrated": ["技能1", "技能2", "技能3"],
  "word_count": 实际字数
}`;
        // 构建User Prompt - 提供完整数据
        const userPrompt = this.buildUserPrompt(data);
        // 调用Claude API - maxTokens=600确保字数足够
        const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 600,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
        });
        const generationTime = Date.now() - startTime;
        console.log(`[即时成长总结] AI生成耗时: ${generationTime}ms`);
        // 解析响应
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('AI返回的内容类型不正确');
        }
        // 提取JSON
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI返回的内容中没有找到JSON');
        }
        const result = JSON.parse(jsonMatch[0]);
        // 【关键】字数验证
        const totalText = result.paragraph_1 + result.paragraph_2 + result.paragraph_3;
        const actualWordCount = totalText.length;
        console.log(`[即时成长总结] 实际字数: ${actualWordCount}`);
        // 如果字数不足300字，重试一次
        if (actualWordCount < 300 && retryCount === 0) {
            console.warn(`[即时成长总结] 字数不足(${actualWordCount}字)，重试生成...`);
            return this.callAI(data, 1); // 重试一次
        }
        // 重试后仍不足，记录错误但仍返回
        if (actualWordCount < 300) {
            console.error(`[即时成长总结] 重试后字数仍不足: ${actualWordCount}字`);
        }
        // 转换为原格式
        const summary = {
            headline: result.headline,
            before_after_comparison: result.paragraph_1,
            breakthrough_point: result.paragraph_2,
            skills_demonstrated: result.skills_demonstrated || [],
            stuck_point_resolved: result.paragraph_2, // 卡点在段落2中
            next_recommendation: result.paragraph_3,
        };
        return summary;
    }
    /**
     * 构建发送给AI的用户提示词
     */
    buildUserPrompt(data) {
        const { order, initialProfile, currentProfile, mentorSessions, growthObservations, history, } = data;
        let prompt = `# 学生本次任务数据

## 订单信息
- 任务名称：${order.title}
- 收入：¥${order.student_price}
- 耗时：${order.time_spent_hours || 0}小时
- 客户评分：${order.client_rating || 0}/5
- 完成时间：${order.completed_at}

## 历史数据对比
- 这是学生完成的第 ${parseInt(history.total_orders) + 1} 个订单
- 历史平均评分：${parseFloat(history.avg_rating || 0).toFixed(1)}/5
- 历史总收入：¥${parseFloat(history.total_earnings || 0).toFixed(2)}

## 六维能力变化（入驻时 → 本次任务后）
`;
        if (initialProfile && currentProfile) {
            const dimensions = [
                { key: 'information_processing', name: '信息处理' },
                { key: 'creative_drive', name: '创作驱动' },
                { key: 'tool_learning', name: '工具学习' },
                { key: 'task_execution', name: '任务执行' },
                { key: 'collaboration_tendency', name: '协作倾向' },
                { key: 'risk_attitude', name: '风险态度' },
            ];
            dimensions.forEach((dim) => {
                const initial = initialProfile[dim.key] || 0;
                const current = currentProfile[dim.key] || 0;
                const change = current - initial;
                const changeStr = change > 0 ? `+${change}` : `${change}`;
                prompt += `- ${dim.name}：${initial} → ${current} (${changeStr})\n`;
            });
            prompt += `\n人格标签：${currentProfile.personality_label || '未设置'}\n`;
        }
        // 导师对话记录
        if (mentorSessions.length > 0) {
            prompt += `\n## 导师对话记录\n`;
            mentorSessions.forEach((session, index) => {
                prompt += `\n### 对话 ${index + 1}\n`;
                if (session.session_summary) {
                    prompt += `总结：${session.session_summary}\n`;
                }
                if (session.key_insights) {
                    prompt += `关键洞察：${JSON.stringify(session.key_insights)}\n`;
                }
                if (session.stuck_points) {
                    prompt += `卡点：${JSON.stringify(session.stuck_points)}\n`;
                }
            });
        }
        // 成长观察
        if (growthObservations.length > 0) {
            prompt += `\n## 成长观察记录\n`;
            growthObservations.forEach((obs, index) => {
                prompt += `\n### 观察 ${index + 1}\n`;
                prompt += `类型：${obs.observation_type}\n`;
                prompt += `内容：${obs.observation_content}\n`;
                if (obs.skills_observed) {
                    prompt += `观察到的技能：${JSON.stringify(obs.skills_observed)}\n`;
                }
            });
        }
        prompt += `\n---\n请基于以上数据，生成这位学生本次任务的即时成长总结。`;
        return prompt;
    }
    /**
     * 保存到缓存表
     */
    async saveToCache(orderId, userId, summary) {
        const client = await database_1.pool.connect();
        try {
            await client.query(`INSERT INTO growth_summary_cache
         (user_id, order_id, summary_json, ai_model, generation_time_ms)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (order_id) DO UPDATE
         SET summary_json = $3, generated_at = NOW()`, [userId, orderId, JSON.stringify(summary), 'claude-3-5-sonnet-20241022', 0]);
        }
        finally {
            client.release();
        }
    }
    /**
     * 更新 mentor_growth_observations 表
     */
    async updateGrowthObservation(orderId, summary) {
        const client = await database_1.pool.connect();
        try {
            // 查找本次订单的最新成长观察记录
            const result = await client.query(`SELECT id FROM mentor_growth_observations
         WHERE order_id = $1
         ORDER BY created_at DESC LIMIT 1`, [orderId]);
            if (result.rows.length > 0) {
                const observationId = result.rows[0].id;
                await client.query(`UPDATE mentor_growth_observations
           SET instant_summary = $1,
               skills_demonstrated = $2
           WHERE id = $3`, [
                    JSON.stringify(summary),
                    JSON.stringify(summary.skills_demonstrated),
                    observationId,
                ]);
            }
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取学生的即时成长总结列表
     */
    async getStudentSummaries(userId, limit = 10) {
        const client = await database_1.pool.connect();
        try {
            const result = await client.query(`SELECT
           gsc.id,
           gsc.order_id,
           gsc.summary_json,
           gsc.generated_at,
           gsc.user_viewed,
           o.title as order_title,
           o.completed_at
         FROM growth_summary_cache gsc
         JOIN orders o ON gsc.order_id = o.id
         WHERE gsc.user_id = $1
         ORDER BY gsc.generated_at DESC
         LIMIT $2`, [userId, limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    /**
     * 标记总结为已查看
     */
    async markAsViewed(summaryId) {
        const client = await database_1.pool.connect();
        try {
            await client.query(`UPDATE growth_summary_cache
         SET user_viewed = true, viewed_at = NOW()
         WHERE id = $1`, [summaryId]);
        }
        finally {
            client.release();
        }
    }
    /**
     * 提交用户反馈
     */
    async submitFeedback(summaryId, feedback) {
        const client = await database_1.pool.connect();
        try {
            await client.query(`UPDATE growth_summary_cache
         SET user_feedback = $1
         WHERE id = $2`, [feedback, summaryId]);
        }
        finally {
            client.release();
        }
    }
}
exports.default = new InstantGrowthSummaryService();
//# sourceMappingURL=instantGrowthSummaryService.js.map