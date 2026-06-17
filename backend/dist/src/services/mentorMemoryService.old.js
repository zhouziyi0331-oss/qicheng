"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorMemoryService = void 0;
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
const claudeService_1 = require("./claudeService");
class MentorMemoryService {
    /**
     * 创建新记忆
     */
    async createMemory(input) {
        try {
            // 自动计算重要性分数（如果未提供）
            const importanceScore = input.importanceScore ||
                await this.calculateImportance(input);
            // 自动生成相关标签（如果未提供）
            const relevanceTags = input.relevanceTags ||
                await this.generateTags(input.memoryContent);
            const query = `
        INSERT INTO mentor_memory (
          student_id, task_id, session_id,
          memory_type, memory_category,
          memory_title, memory_content, memory_context,
          importance_score, relevance_tags, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
            const result = await database_1.pool.query(query, [
                input.studentId,
                input.taskId,
                input.sessionId,
                input.memoryType,
                input.memoryCategory,
                input.memoryTitle,
                input.memoryContent,
                JSON.stringify(input.memoryContext || {}),
                importanceScore,
                relevanceTags,
                input.expiresAt
            ]);
            const memory = result.rows[0];
            // 异步查找并关联相关记忆
            this.linkRelatedMemories(memory.id, input.studentId, relevanceTags).catch(err => {
                logger_1.default.error('关联相关记忆失败', { error: err, memoryId: memory.id });
            });
            return memory;
        }
        catch (error) {
            logger_1.default.error('创建记忆失败', { error, input });
            throw error;
        }
    }
    /**
     * 计算记忆重要性分数
     */
    async calculateImportance(input) {
        // 基础分数
        let score = 0.5;
        // 根据类型调整
        const typeWeights = {
            breakthrough: 0.9,
            struggle: 0.7,
            milestone: 0.9,
            pattern: 0.6,
            preference: 0.5
        };
        score = typeWeights[input.memoryType] || 0.5;
        // 根据类别调整
        if (input.memoryCategory === 'emotional') {
            score += 0.1; // 情绪记忆更重要
        }
        // 根据内容长度调整（更详细的记忆可能更重要）
        if (input.memoryContent.length > 200) {
            score += 0.05;
        }
        return Math.min(score, 1.0);
    }
    /**
     * 生成相关标签
     */
    async generateTags(content) {
        const tags = [];
        // 技术关键词
        const techKeywords = ['代码', '函数', '变量', 'bug', '错误', '调试', 'API', '数据库', '前端', '后端'];
        techKeywords.forEach(keyword => {
            if (content.includes(keyword)) {
                tags.push(keyword);
            }
        });
        // 情绪关键词
        const emotionKeywords = ['焦虑', '兴奋', '沮丧', '困惑', '自信', '害怕', '骄傲'];
        emotionKeywords.forEach(keyword => {
            if (content.includes(keyword)) {
                tags.push(keyword);
            }
        });
        // 学习关键词
        const learningKeywords = ['理解', '掌握', '学会', '突破', '困难', '进步', '提问'];
        learningKeywords.forEach(keyword => {
            if (content.includes(keyword)) {
                tags.push(keyword);
            }
        });
        return [...new Set(tags)]; // 去重
    }
    /**
     * 关联相关记忆
     */
    async linkRelatedMemories(memoryId, studentId, tags) {
        try {
            // 查找有相同标签的记忆
            const query = `
        SELECT id
        FROM mentor_memory
        WHERE student_id = $1
          AND id != $2
          AND relevance_tags && $3
        ORDER BY importance_score DESC
        LIMIT 5
      `;
            const result = await database_1.pool.query(query, [studentId, memoryId, tags]);
            const relatedIds = result.rows.map(row => row.id);
            if (relatedIds.length > 0) {
                // 更新当前记忆的关联
                await database_1.pool.query(`UPDATE mentor_memory SET related_memories = $1 WHERE id = $2`, [relatedIds, memoryId]);
                // 双向关联：也更新相关记忆
                for (const relatedId of relatedIds) {
                    await database_1.pool.query(`UPDATE mentor_memory
             SET related_memories = array_append(
               COALESCE(related_memories, ARRAY[]::integer[]),
               $1
             )
             WHERE id = $2 AND NOT ($1 = ANY(COALESCE(related_memories, ARRAY[]::integer[])))`, [memoryId, relatedId]);
                }
            }
        }
        catch (error) {
            logger_1.default.error('关联记忆失败', { error, memoryId });
        }
    }
    /**
     * 召回相关记忆
     */
    async recallMemories(studentId, context, limit = 5) {
        try {
            // 1. 构建查询条件
            let query = `
        SELECT *
        FROM mentor_memory
        WHERE student_id = $1
          AND (expires_at IS NULL OR expires_at > NOW())
      `;
            const params = [studentId];
            let paramIndex = 2;
            // 按标签过滤
            if (context.searchTags && context.searchTags.length > 0) {
                query += ` AND relevance_tags && $${paramIndex}`;
                params.push(context.searchTags);
                paramIndex++;
            }
            // 按情绪过滤
            if (context.currentEmotion) {
                query += ` AND $${paramIndex} = ANY(relevance_tags)`;
                params.push(context.currentEmotion);
                paramIndex++;
            }
            // 排序：重要性 + 最近召回时间
            query += `
        ORDER BY
          importance_score DESC,
          COALESCE(last_recalled_at, created_at) DESC
        LIMIT $${paramIndex}
      `;
            params.push(limit);
            const result = await database_1.pool.query(query, params);
            const memories = result.rows;
            // 2. 更新召回统计
            for (const memory of memories) {
                await this.incrementRecallCount(memory.id);
            }
            // 3. 生成记忆摘要和洞察
            const summary = await this.generateMemorySummary(memories, context);
            const insights = await this.generateInsights(memories, context);
            return {
                relevantMemories: memories,
                summary,
                insights
            };
        }
        catch (error) {
            logger_1.default.error('召回记忆失败', { error, studentId, context });
            return {
                relevantMemories: [],
                summary: '',
                insights: []
            };
        }
    }
    /**
     * 增加召回次数
     */
    async incrementRecallCount(memoryId) {
        await database_1.pool.query(`UPDATE mentor_memory
       SET times_recalled = times_recalled + 1,
           last_recalled_at = NOW()
       WHERE id = $1`, [memoryId]);
    }
    /**
     * 生成记忆摘要
     */
    async generateMemorySummary(memories, context) {
        if (memories.length === 0) {
            return '这是我们第一次交流，我还在了解你。';
        }
        // 简单摘要（不使用AI，节省成本）
        const struggles = memories.filter(m => m.memoryType === 'struggle');
        const breakthroughs = memories.filter(m => m.memoryType === 'breakthrough');
        const patterns = memories.filter(m => m.memoryType === 'pattern');
        let summary = '';
        if (breakthroughs.length > 0) {
            summary += `我记得你曾经${breakthroughs[0].memoryTitle}。`;
        }
        if (struggles.length > 0) {
            summary += `上次你在${struggles[0].memoryTitle}时遇到了困难。`;
        }
        if (patterns.length > 0) {
            summary += `我注意到${patterns[0].memoryTitle}。`;
        }
        return summary || '让我们继续一起学习。';
    }
    /**
     * 生成洞察
     */
    async generateInsights(memories, context) {
        const insights = [];
        // 分析情绪模式
        const emotionalMemories = memories.filter(m => m.memoryCategory === 'emotional');
        if (emotionalMemories.length >= 2) {
            const emotions = emotionalMemories.map(m => m.relevanceTags).flat();
            const anxiousCount = emotions.filter(e => e === '焦虑').length;
            if (anxiousCount >= 2) {
                insights.push('你在遇到新挑战时容易感到焦虑，我会给你更多鼓励和支持');
            }
        }
        // 分析学习模式
        const technicalMemories = memories.filter(m => m.memoryCategory === 'technical');
        if (technicalMemories.length >= 2) {
            insights.push('你在技术问题上很有钻研精神');
        }
        // 分析成长轨迹
        const breakthroughs = memories.filter(m => m.memoryType === 'breakthrough');
        if (breakthroughs.length >= 2) {
            insights.push('你已经克服了多个困难，证明了你的学习能力');
        }
        return insights;
    }
    /**
     * 自动从对话中提取记忆
     */
    async extractMemoryFromConversation(studentId, taskId, sessionId, messages, currentEmotion) {
        try {
            // 使用AI分析对话，提取值得记住的内容
            const prompt = `分析以下对话，提取值得记住的关键信息。

对话内容：
${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

当前情绪：${currentEmotion || '未知'}

请识别以下类型的记忆：
1. struggle（困难）- 学生遇到的困难、卡住的地方
2. breakthrough（突破）- 学生的顿悟、解决问题的时刻
3. pattern（模式）- 学生的学习模式、思维方式
4. preference（偏好）- 学生的学习偏好、沟通方式

对于每个值得记住的内容，返回JSON数组：
[
  {
    "memoryType": "类型",
    "memoryCategory": "technical/emotional/behavioral/learning",
    "memoryTitle": "简短标题（10字内）",
    "memoryContent": "详细内容（50字内）",
    "importanceScore": 0.0-1.0,
    "relevanceTags": ["标签1", "标签2"]
  }
]

如果没有值得记住的内容，返回空数组 []`;
            const response = await claudeService_1.claudeService.chat([{ role: 'user', content: prompt }], {
                model: 'claude-haiku-4-5',
                maxTokens: 1000,
                temperature: 0.3
            });
            const extractedMemories = JSON.parse(response);
            const createdMemories = [];
            for (const memoryData of extractedMemories) {
                const memory = await this.createMemory({
                    studentId,
                    taskId,
                    sessionId,
                    ...memoryData
                });
                createdMemories.push(memory);
            }
            return createdMemories;
        }
        catch (error) {
            logger_1.default.error('从对话提取记忆失败', { error, studentId, sessionId });
            return [];
        }
    }
    /**
     * 获取学生的所有记忆
     */
    async getAllMemories(studentId, options) {
        try {
            let query = `
        SELECT *
        FROM mentor_memory
        WHERE student_id = $1
          AND (expires_at IS NULL OR expires_at > NOW())
      `;
            const params = [studentId];
            let paramIndex = 2;
            if (options?.memoryType) {
                query += ` AND memory_type = $${paramIndex}`;
                params.push(options.memoryType);
                paramIndex++;
            }
            if (options?.memoryCategory) {
                query += ` AND memory_category = $${paramIndex}`;
                params.push(options.memoryCategory);
                paramIndex++;
            }
            if (options?.minImportance) {
                query += ` AND importance_score >= $${paramIndex}`;
                params.push(options.minImportance);
                paramIndex++;
            }
            query += ` ORDER BY importance_score DESC, created_at DESC`;
            if (options?.limit) {
                query += ` LIMIT $${paramIndex}`;
                params.push(options.limit);
            }
            const result = await database_1.pool.query(query, params);
            return result.rows;
        }
        catch (error) {
            logger_1.default.error('获取记忆失败', { error, studentId, options });
            return [];
        }
    }
    /**
     * 更新记忆重要性
     */
    async updateImportance(memoryId, newScore) {
        await database_1.pool.query(`UPDATE mentor_memory SET importance_score = $1 WHERE id = $2`, [Math.max(0, Math.min(1, newScore)), memoryId]);
    }
    /**
     * 删除过期记忆
     */
    async cleanupExpiredMemories() {
        try {
            const result = await database_1.pool.query(`DELETE FROM mentor_memory
         WHERE expires_at IS NOT NULL AND expires_at < NOW()
         RETURNING id`);
            logger_1.default.info('清理过期记忆', { count: result.rowCount });
            return result.rowCount || 0;
        }
        catch (error) {
            logger_1.default.error('清理过期记忆失败', { error });
            return 0;
        }
    }
    /**
     * 获取记忆统计
     */
    async getMemoryStats(studentId) {
        try {
            // 总数
            const totalResult = await database_1.pool.query(`SELECT COUNT(*) as count FROM mentor_memory WHERE student_id = $1`, [studentId]);
            // 按类型
            const typeResult = await database_1.pool.query(`SELECT memory_type, COUNT(*) as count
         FROM mentor_memory
         WHERE student_id = $1
         GROUP BY memory_type`, [studentId]);
            // 按类别
            const categoryResult = await database_1.pool.query(`SELECT memory_category, COUNT(*) as count
         FROM mentor_memory
         WHERE student_id = $1
         GROUP BY memory_category`, [studentId]);
            // 平均重要性
            const avgResult = await database_1.pool.query(`SELECT AVG(importance_score) as avg FROM mentor_memory WHERE student_id = $1`, [studentId]);
            // 最常召回的记忆
            const mostRecalledResult = await database_1.pool.query(`SELECT * FROM mentor_memory
         WHERE student_id = $1
         ORDER BY times_recalled DESC
         LIMIT 5`, [studentId]);
            return {
                totalMemories: parseInt(totalResult.rows[0]?.count || '0'),
                byType: typeResult.rows.reduce((acc, row) => {
                    acc[row.memory_type] = parseInt(row.count);
                    return acc;
                }, {}),
                byCategory: categoryResult.rows.reduce((acc, row) => {
                    acc[row.memory_category] = parseInt(row.count);
                    return acc;
                }, {}),
                averageImportance: parseFloat(avgResult.rows[0]?.avg || '0'),
                mostRecalled: mostRecalledResult.rows
            };
        }
        catch (error) {
            logger_1.default.error('获取记忆统计失败', { error, studentId });
            return {
                totalMemories: 0,
                byType: {},
                byCategory: {},
                averageImportance: 0,
                mostRecalled: []
            };
        }
    }
}
exports.mentorMemoryService = new MentorMemoryService();
//# sourceMappingURL=mentorMemoryService.old.js.map