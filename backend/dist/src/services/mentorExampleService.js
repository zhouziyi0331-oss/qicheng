"use strict";
/**
 * AI导师范例展示服务
 *
 * 功能：
 * 1. 检索相似项目案例
 * 2. 格式化案例展示
 * 3. 集成到T-02场景（学生连续求助时）
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
class MentorExampleService {
    /**
     * 检索相似项目案例
     *
     * @param currentProjectId 当前项目ID
     * @param studentLevel 学生等级
     * @param limit 返回案例数量
     */
    async findSimilarCase(currentProjectId, studentLevel, limit = 1) {
        try {
            logger_1.default.info(`[MentorExample] 开始检索相似案例: project=${currentProjectId}, level=${studentLevel}`);
            // 获取当前项目的描述向量
            const currentProject = await database_1.default.query(`
        SELECT title, description, description_embedding
        FROM projects
        WHERE id = $1
      `, [currentProjectId]);
            if (currentProject.rows.length === 0) {
                logger_1.default.warn(`[MentorExample] 项目不存在: ${currentProjectId}`);
                return null;
            }
            const currentEmbedding = currentProject.rows[0].description_embedding;
            if (!currentEmbedding) {
                logger_1.default.warn(`[MentorExample] 项目没有向量: ${currentProjectId}`);
                return null;
            }
            // 使用pgvector检索相似项目
            const similarCases = await database_1.default.query(`
        SELECT
          o.id as order_id,
          p.title as project_title,
          p.deliverable_type as project_type,
          u.current_level as student_level,
          o.client_rating,
          mgo.obs_content as retrospective_content,
          mgo.breakthrough as approach_summary,
          mgo.skills_shown as tools_used,
          -- 计算余弦相似度
          1 - (p.description_embedding <=> $1::vector) as similarity_score
        FROM orders o
        JOIN projects p ON o.project_id = p.id
        JOIN users u ON o.student_id = u.id
        LEFT JOIN mentor_growth_observations mgo ON o.id = mgo.order_id
        WHERE o.status = 'completed'
          AND o.client_rating >= 4.0
          AND u.current_level BETWEEN $2 - 1 AND $2 + 1
          AND p.id != $3
          AND p.description_embedding IS NOT NULL
          AND mgo.breakthrough IS NOT NULL
          AND mgo.breakthrough != ''
        ORDER BY p.description_embedding <=> $1::vector
        LIMIT $4
      `, [currentEmbedding, studentLevel, currentProjectId, limit]);
            if (similarCases.rows.length === 0) {
                logger_1.default.info(`[MentorExample] 未找到相似案例`);
                return null;
            }
            const topCase = similarCases.rows[0];
            logger_1.default.info(`[MentorExample] 找到相似案例: ${topCase.order_id}, 相似度=${topCase.similarity_score}`);
            return {
                order_id: topCase.order_id,
                project_title: topCase.project_title,
                project_type: topCase.project_type,
                student_level: topCase.student_level,
                client_rating: parseFloat(topCase.client_rating),
                retrospective_content: topCase.retrospective_content,
                approach_summary: topCase.approach_summary,
                tools_used: topCase.tools_used || [],
                key_learnings: this.extractKeyLearnings(topCase.retrospective_content),
                similarity_score: parseFloat(topCase.similarity_score)
            };
        }
        catch (error) {
            logger_1.default.error('[MentorExample] 检索相似案例失败:', error);
            return null;
        }
    }
    /**
     * 格式化案例展示
     */
    formatCaseForDisplay(similarCase) {
        const title = `参考案例：${similarCase.project_title}`;
        const metadata = `Lv.${similarCase.student_level} | 评分${similarCase.client_rating.toFixed(1)}/5.0 | ${similarCase.project_type}`;
        const approach = similarCase.approach_summary || '该同学通过系统化的方法完成了项目';
        const tools = similarCase.tools_used.length > 0
            ? `使用工具：${similarCase.tools_used.join('、')}`
            : '';
        const learnings = similarCase.key_learnings.length > 0
            ? `关键收获：\n${similarCase.key_learnings.map(l => `- ${l}`).join('\n')}`
            : '';
        const full_text = `
## ${title}

**项目信息：** ${metadata}

**这位同学的做法：**
${approach}

${tools ? `**${tools}**` : ''}

${learnings ? `**${learnings}**` : ''}

---

现在回到你的项目——你觉得可以参考他的哪一步？
    `.trim();
        return {
            title,
            metadata,
            approach,
            tools,
            learnings,
            full_text
        };
    }
    /**
     * 从复盘内容中提取关键学习点
     */
    extractKeyLearnings(retrospectiveContent) {
        if (!retrospectiveContent)
            return [];
        const learnings = [];
        // 简单的关键词提取
        const keywords = [
            '学会了', '掌握了', '理解了', '发现了',
            '突破了', '克服了', '解决了', '提升了'
        ];
        const sentences = retrospectiveContent.split(/[。！？\n]/);
        for (const sentence of sentences) {
            for (const keyword of keywords) {
                if (sentence.includes(keyword) && sentence.length < 50) {
                    learnings.push(sentence.trim());
                    break;
                }
            }
            if (learnings.length >= 3)
                break;
        }
        return learnings;
    }
    /**
     * 检测是否应该展示范例
     *
     * @param conversationHistory 对话历史
     * @returns 是否应该展示范例
     */
    shouldShowExample(conversationHistory) {
        // 检测最近3条消息中是否有连续2次求助
        const recentMessages = conversationHistory.slice(-3);
        let stuckCount = 0;
        const stuckKeywords = ['不会', '不知道', '怎么做', '还是卡住', '还是不行', '做不了'];
        for (const msg of recentMessages) {
            if (msg.sender_type === 'student') {
                const hasStuckKeyword = stuckKeywords.some(keyword => msg.message.includes(keyword));
                if (hasStuckKeyword) {
                    stuckCount++;
                }
            }
        }
        return stuckCount >= 2;
    }
    /**
     * 记录范例展示
     */
    async recordExampleShown(studentId, orderId, exampleOrderId, similarityScore) {
        try {
            await database_1.default.query(`
        INSERT INTO mentor_sessions (
          id, user_id, order_id, trigger_type, sender_type,
          message, context_snapshot, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
                (0, uuid_1.v4)(),
                studentId,
                orderId,
                'example_shown',
                'system',
                `展示了相似案例：${exampleOrderId}`,
                JSON.stringify({
                    example_order_id: exampleOrderId,
                    similarity_score: similarityScore
                })
            ]);
            logger_1.default.info(`[MentorExample] 记录范例展示: student=${studentId}, example=${exampleOrderId}`);
        }
        catch (error) {
            logger_1.default.error('[MentorExample] 记录范例展示失败:', error);
        }
    }
    /**
     * 获取范例展示统计
     */
    async getExampleStats(days = 7) {
        try {
            const result = await database_1.default.query(`
        SELECT
          COUNT(*) as total_shown,
          COUNT(DISTINCT user_id) as unique_students,
          AVG((context_snapshot->>'similarity_score')::float) as avg_similarity
        FROM mentor_sessions
        WHERE trigger_type = 'example_shown'
          AND created_at > NOW() - INTERVAL '${days} days'
      `);
            return result.rows[0];
        }
        catch (error) {
            logger_1.default.error('[MentorExample] 获取统计失败:', error);
            return {
                total_shown: 0,
                unique_students: 0,
                avg_similarity: 0
            };
        }
    }
}
exports.default = new MentorExampleService();
//# sourceMappingURL=mentorExampleService.js.map