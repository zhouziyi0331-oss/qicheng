"use strict";
/**
 * AI导师项目复盘服务
 *
 * 功能：
 * 1. 订单完成后触发复盘引导
 * 2. 生成3个复盘问题
 * 3. 保存学生回答
 * 4. 提取精华复盘进入知识中台
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class MentorRetrospectiveService {
    constructor() {
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
    }
    /**
     * 订单完成后触发复盘（延迟60秒）
     */
    async triggerRetrospective(studentId, orderId) {
        try {
            logger_1.default.info(`[MentorRetrospective] 触发复盘: student=${studentId}, order=${orderId}`);
            // 检查是否已经发送过复盘
            const existing = await db.query(`
        SELECT id FROM mentor_retrospectives WHERE order_id = $1
      `, [orderId]);
            if (existing.rows.length > 0) {
                logger_1.default.info(`[MentorRetrospective] 复盘已存在，跳过`);
                return;
            }
            // 生成复盘问题
            const questions = await this.generateQuestions(studentId, orderId);
            // 创建复盘记录
            const retrospectiveId = (0, uuid_1.v4)();
            await db.query(`
        INSERT INTO mentor_retrospectives (
          id, student_id, order_id, questions, status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
                retrospectiveId,
                studentId,
                orderId,
                JSON.stringify(questions),
                'pending'
            ]);
            // 发送复盘引导消息到mentor_sessions
            const messageText = this.formatRetrospectiveMessage(questions);
            await db.query(`
        INSERT INTO mentor_sessions (
          id, user_id, order_id, trigger_type, sender_type,
          message, context_snapshot, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
                (0, uuid_1.v4)(),
                studentId,
                orderId,
                'retrospective',
                'ai',
                messageText,
                JSON.stringify({ retrospective_id: retrospectiveId })
            ]);
            logger_1.default.info(`[MentorRetrospective] 复盘已发送: ${retrospectiveId}`);
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 触发复盘失败:', error);
            throw error;
        }
    }
    /**
     * 生成个性化的复盘问题
     */
    async generateQuestions(studentId, orderId) {
        try {
            // 获取订单和项目信息
            const orderInfo = await db.query(`
        SELECT
          o.id,
          p.title as project_title,
          p.description as project_description,
          p.deliverable_type,
          o.client_rating,
          u.current_level
        FROM orders o
        JOIN projects p ON o.project_id = p.id
        JOIN users u ON o.student_id = u.id
        WHERE o.id = $1
      `, [orderId]);
            if (orderInfo.rows.length === 0) {
                throw new Error('订单不存在');
            }
            const order = orderInfo.rows[0];
            // 获取学生在这个订单中的卡点
            const stuckPoints = await db.query(`
        SELECT obs_content
        FROM mentor_growth_observations
        WHERE order_id = $1 AND obs_type = 'stuck_point'
        ORDER BY observed_at DESC
        LIMIT 3
      `, [orderId]);
            const stuckPointsText = stuckPoints.rows
                .map(row => row.obs_content)
                .join('；');
            // 使用AI生成个性化问题
            const prompt = `你是启程平台的AI导师。学生刚完成了一个项目，你需要生成3个复盘问题。

## 项目信息
- 标题：${order.project_title}
- 类型：${order.deliverable_type}
- 学生等级：Lv.${order.current_level}
- 客户评分：${order.client_rating}/5.0

${stuckPointsText ? `## 学生在项目中的卡点
${stuckPointsText}` : ''}

## 要求
生成3个复盘问题，每个问题要：
1. 具体、有针对性（引用项目信息）
2. 引导学生反思，而非简单回答
3. 控制在30字以内

## 问题模板
1. 关于难点和解决方法（如果有卡点，引用具体卡点）
2. 关于改进空间（引导学生思考下次可以做得更好的地方）
3. 关于工具使用（询问使用了哪些工具，哪个最顺手）

请以JSON格式返回：
{
  "question1": "问题1",
  "question2": "问题2",
  "question3": "问题3"
}`;
            const message = await this.anthropic.messages.create({
                model: 'claude-haiku-4-5',
                max_tokens: 300,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }]
            });
            const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
            const questions = JSON.parse(responseText);
            return questions;
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 生成问题失败，使用默认问题:', error);
            // 降级：使用默认问题
            return {
                question1: '这个项目最大的难点是什么？你是怎么解决的？',
                question2: '如果下次接到类似项目，你会在哪里做得不一样？',
                question3: '你在这个项目里用了哪些工具？哪个最顺手？'
            };
        }
    }
    /**
     * 格式化复盘消息
     */
    formatRetrospectiveMessage(questions) {
        return `这个项目做完了，花5分钟复盘一下——这对你以后接单很有用：

1️⃣ ${questions.question1}

2️⃣ ${questions.question2}

3️⃣ ${questions.question3}

不用写很多，每个问题一句话就行。写完后这份复盘会自动进入你的成长记录。`;
    }
    /**
     * 保存学生回答
     */
    async saveAnswers(retrospectiveId, answers) {
        try {
            logger_1.default.info(`[MentorRetrospective] 保存回答: ${retrospectiveId}`);
            // 更新复盘记录
            await db.query(`
        UPDATE mentor_retrospectives
        SET answers = $1,
            status = 'completed',
            completed_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(answers), retrospectiveId]);
            // 提取精华复盘
            await this.extractFeaturedInsights(retrospectiveId);
            logger_1.default.info(`[MentorRetrospective] 回答已保存`);
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 保存回答失败:', error);
            throw error;
        }
    }
    /**
     * 跳过复盘
     */
    async skipRetrospective(retrospectiveId) {
        try {
            await db.query(`
        UPDATE mentor_retrospectives
        SET status = 'skipped'
        WHERE id = $1
      `, [retrospectiveId]);
            logger_1.default.info(`[MentorRetrospective] 复盘已跳过: ${retrospectiveId}`);
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 跳过复盘失败:', error);
            throw error;
        }
    }
    /**
     * 提取精华复盘（进入知识中台）
     */
    async extractFeaturedInsights(retrospectiveId) {
        try {
            // 获取复盘内容
            const retrospective = await db.query(`
        SELECT
          mr.*,
          o.project_id,
          p.title as project_title,
          p.deliverable_type,
          o.client_rating
        FROM mentor_retrospectives mr
        JOIN orders o ON mr.order_id = o.id
        JOIN projects p ON o.project_id = p.id
        WHERE mr.id = $1
      `, [retrospectiveId]);
            if (retrospective.rows.length === 0) {
                return;
            }
            const retro = retrospective.rows[0];
            const answers = retro.answers;
            // 判断是否是精华复盘
            const isFeatured = this.shouldBeFeatured(retro);
            if (isFeatured) {
                // 标记为精华
                await db.query(`
          UPDATE mentor_retrospectives
          SET is_featured = true,
              featured_reason = $1
          WHERE id = $2
        `, ['高质量复盘，包含具体方法和工具', retrospectiveId]);
                // 写入成长观察表（作为突破记录）
                const breakthroughText = `项目复盘：${answers.answer1}。改进方向：${answers.answer2}。工具使用：${answers.answer3}`;
                await db.query(`
          INSERT INTO mentor_growth_observations (
            id, user_id, order_id, obs_type, obs_content,
            observation_category, breakthrough, is_significant, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
                    (0, uuid_1.v4)(),
                    retro.student_id,
                    retro.order_id,
                    'milestone',
                    breakthroughText,
                    'project_retrospective',
                    answers.answer1, // 最大难点和解决方法作为突破
                    true,
                    ['复盘', retro.deliverable_type]
                ]);
                logger_1.default.info(`[MentorRetrospective] 精华复盘已提取: ${retrospectiveId}`);
            }
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 提取精华失败:', error);
        }
    }
    /**
     * 判断是否应该标记为精华复盘
     */
    shouldBeFeatured(retrospective) {
        const answers = retrospective.answers;
        // 条件1：客户评分≥4.5
        if (retrospective.client_rating < 4.5) {
            return false;
        }
        // 条件2：每个回答都有实质内容（>20字）
        if (answers.answer1.length < 20 ||
            answers.answer2.length < 20 ||
            answers.answer3.length < 20) {
            return false;
        }
        // 条件3：包含具体的工具或方法
        const hasSpecificTools = /工具|软件|平台|方法|步骤/.test(answers.answer1 + answers.answer2 + answers.answer3);
        return hasSpecificTools;
    }
    /**
     * 获取待完成的复盘
     */
    async getPendingRetrospectives(studentId) {
        try {
            const result = await database_1.pool.query(`
        SELECT
          mr.*,
          p.title as project_title
        FROM mentor_retrospectives mr
        JOIN orders o ON mr.order_id = o.id
        JOIN projects p ON o.project_id = p.id
        WHERE mr.student_id = $1
          AND mr.status = 'pending'
        ORDER BY mr.sent_at DESC
      `, [studentId]);
            return result.rows;
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 获取待完成复盘失败:', error);
            return [];
        }
    }
    /**
     * 获取历史复盘
     */
    async getRetrospectiveHistory(studentId, limit = 10) {
        try {
            const result = await database_1.pool.query(`
        SELECT
          mr.*,
          p.title as project_title,
          o.client_rating
        FROM mentor_retrospectives mr
        JOIN orders o ON mr.order_id = o.id
        JOIN projects p ON o.project_id = p.id
        WHERE mr.student_id = $1
          AND mr.status = 'completed'
        ORDER BY mr.completed_at DESC
        LIMIT $2
      `, [studentId, limit]);
            return result.rows;
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 获取历史复盘失败:', error);
            return [];
        }
    }
    /**
     * 获取复盘统计
     */
    async getRetrospectiveStats(days = 7) {
        try {
            const result = await database_1.pool.query(`
        SELECT
          COUNT(*) as total_sent,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped_count,
          COUNT(CASE WHEN is_featured THEN 1 END) as featured_count,
          ROUND(
            COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric /
            NULLIF(COUNT(*), 0) * 100,
            2
          ) as completion_rate
        FROM mentor_retrospectives
        WHERE sent_at > NOW() - INTERVAL '${days} days'
      `);
            return result.rows[0];
        }
        catch (error) {
            logger_1.default.error('[MentorRetrospective] 获取统计失败:', error);
            return {
                total_sent: 0,
                completed_count: 0,
                skipped_count: 0,
                featured_count: 0,
                completion_rate: 0
            };
        }
    }
}
exports.default = new MentorRetrospectiveService();
//# sourceMappingURL=mentorRetrospectiveService.js.map