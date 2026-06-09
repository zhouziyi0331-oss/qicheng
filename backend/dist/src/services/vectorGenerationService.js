"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const client = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
// BGE Embedding API配置（使用硅基流动或阿里云PAI）
const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL || 'https://api.siliconflow.cn/v1/embeddings';
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || process.env.ANTHROPIC_API_KEY;
const EMBEDDING_MODEL = 'BAAI/bge-large-zh-v1.5'; // 1024维中文语义模型
/**
 * 向量生成服务
 * 使用Claude API生成任务和学生的embedding向量
 */
class VectorGenerationService {
    constructor() {
        this.embeddingCache = new Map();
        this.CACHE_TTL = 3600000; // 1小时缓存
    }
    /**
     * 生成文本的embedding向量
     * 使用BGE-large-zh-v1.5模型（1024维中文语义向量）
     */
    async generateEmbedding(text, dimension = 1024) {
        const cacheKey = `${text.substring(0, 100)}_${dimension}`;
        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey);
        }
        try {
            // 调用BGE Embedding API
            const response = await axios_1.default.post(EMBEDDING_API_URL, {
                model: EMBEDDING_MODEL,
                input: text,
                encoding_format: 'float'
            }, {
                headers: {
                    'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            const vector = response.data.data[0].embedding;
            if (!vector || vector.length !== dimension) {
                throw new Error(`Expected ${dimension} dimensions, got ${vector?.length || 0}`);
            }
            // 缓存结果
            this.embeddingCache.set(cacheKey, vector);
            setTimeout(() => this.embeddingCache.delete(cacheKey), this.CACHE_TTL);
            return vector;
        }
        catch (error) {
            logger_1.default.error('Failed to generate embedding:', error);
            // Fallback: 如果API失败，使用简化的TF-IDF方法
            logger_1.default.warn('Falling back to TF-IDF method');
            return this.textToVectorFallback(text, dimension);
        }
    }
    /**
     * Fallback方法：简化的TF-IDF向量化（当Embedding API不可用时）
     */
    textToVectorFallback(text, dimension) {
        // 1. 文本预处理
        const cleanText = text.toLowerCase()
            .replace(/[^一-龥a-z0-9\s]/g, ' ') // 保留中文、英文、数字
            .replace(/\s+/g, ' ')
            .trim();
        // 2. 分词（简单按空格和字符分割）
        const words = cleanText.split(/\s+/);
        const chars = cleanText.split('');
        // 3. 计算词频
        const wordFreq = new Map();
        words.forEach(word => {
            if (word.length > 1) {
                wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
            }
        });
        // 4. 生成向量
        const vector = new Array(dimension).fill(0);
        // 使用哈希函数将词映射到向量维度
        wordFreq.forEach((freq, word) => {
            const hash = this.simpleHash(word);
            const index = Math.abs(hash) % dimension;
            vector[index] += freq / words.length; // 归一化频率
        });
        // 添加字符级特征（用于中文）
        const charFreq = new Map();
        chars.forEach(char => {
            if (char.match(/[一-龥]/)) { // 只统计中文字符
                charFreq.set(char, (charFreq.get(char) || 0) + 1);
            }
        });
        charFreq.forEach((freq, char) => {
            const hash = this.simpleHash(char);
            const index = Math.abs(hash) % dimension;
            vector[index] += (freq / chars.length) * 0.5; // 字符特征权重较低
        });
        // 5. 归一化向量
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            return vector.map(val => val / magnitude);
        }
        return vector;
    }
    /**
     * 简单的字符串哈希函数
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    /**
     * 生成任务向量
     */
    async generateTaskVectors(taskId) {
        try {
            // 获取任务信息
            const task = await (0, db_1.queryOne)(`SELECT title, description, required_skills, track_type, level_required,
                budget_min, budget_max
         FROM tasks WHERE id = $1`, [taskId]);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            // 生成标题向量
            const titleEmbedding = await this.generateEmbedding(task.title, 1536);
            // 生成描述向量
            const descriptionText = `${task.description}\n技能要求: ${task.required_skills?.join(', ') || '无'}\n类型: ${task.track_type}\n难度: ${task.level_required}`;
            const descriptionEmbedding = await this.generateEmbedding(descriptionText, 1536);
            // 生成组合向量（标题和描述的加权平均）
            const combinedEmbedding = titleEmbedding.map((val, idx) => val * 0.3 + descriptionEmbedding[idx] * 0.7);
            logger_1.default.info(`Generated vectors for task ${taskId}`);
            return {
                titleEmbedding,
                descriptionEmbedding,
                combinedEmbedding
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to generate task vectors for ${taskId}:`, error);
            throw error;
        }
    }
    /**
     * 生成学生能力画像摘要（自然语言描述，不是标签）
     */
    async generateStudentProfileSummary(studentId) {
        try {
            // 获取学生数据
            const student = await (0, db_1.queryOne)(`SELECT username, bio FROM users WHERE id = $1`, [studentId]);
            // 获取OPC测评结果
            const opcResults = await (0, db_1.queryOne)(`SELECT opc_openness as openness, opc_persistence as persistence,
                opc_creativity as creativity, personality_style
         FROM student_capabilities WHERE student_id = $1`, [studentId]);
            // 获取项目完成数据
            const projectData = await (0, db_1.query)(`SELECT t.title, t.description, tr.feedback as client_feedback,
                tr.quality_score
         FROM task_applications ta
         JOIN tasks t ON ta.task_id = t.id
         LEFT JOIN task_reviews tr ON tr.task_id = t.id
         WHERE ta.student_id = $1 AND ta.status = 'completed'
         ORDER BY t.created_at DESC
         LIMIT 5`, [studentId]);
            // 使用Claude生成能力画像摘要
            // 关键：摘要结构必须和项目需求摘要对应，才能在同一个语义空间里匹配
            const prompt = `你是启程平台的AI-01。请根据学生的38题测试结果和项目经历，生成一段结构化的能力画像摘要。

## 核心原则
这段摘要将被转成1024维向量，用于和项目需求向量做语义匹配。所以必须包含以下六个维度，且用自然语言描述（不是标签）。

## 必需结构（严格按此顺序）

人格标签：[如"视觉叙事者"]
工作风格：[从信息处理维度提取，如"习惯先看全局再拆解，善于找到各部分之间的联系"]
创作偏好：[从创作驱动维度提取，如"灵感来源于视觉元素，擅长用画面讲故事"]
工具习惯：[从工具学习维度提取，如"拿到新工具直接上手试，边用边学"]
执行节奏：[从任务执行维度提取，如"习惯先出粗糙版本再一轮轮打磨"]
协作倾向：[从协作倾向维度提取，如"更喜欢自己从头到尾负责一个完整模块"]
风险偏好：[从风险态度维度提取，如"愿意尝试有挑战的新项目，但会先评估可行性"]
擅长方向：[基于六维综合判断，如"品牌视觉设计、社交媒体内容、创意广告"]

## 学生数据

**OPC测评**：
- 开放性：${opcResults?.openness || 'N/A'}/100
- 坚持性：${opcResults?.persistence || 'N/A'}/100
- 创造力：${opcResults?.creativity || 'N/A'}/100
- 性格风格：${opcResults?.personality_style || '未测评'}

**自我介绍**：${student?.bio || '暂无'}

**项目经历**：
${projectData.map((p, i) => `
${i + 1}. ${p.title}
   - 客户反馈：${p.client_feedback || '暂无'}
   - 质量评分：${p.quality_score || 'N/A'}/5
`).join('\n')}

请严格按照上述结构生成摘要（约200字），每个维度用一句话描述：`;
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet',
                max_tokens: 500,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type from Claude');
            }
            const summary = content.text.trim();
            // 保存摘要到数据库
            await (0, db_1.query)(`UPDATE student_capabilities
         SET profile_summary = $1, updated_at = NOW()
         WHERE student_id = $2`, [summary, studentId]);
            logger_1.default.info(`Generated profile summary for student ${studentId}`);
            return summary;
        }
        catch (error) {
            logger_1.default.error(`Failed to generate profile summary for student ${studentId}:`, error);
            throw error;
        }
    }
    /**
     * 生成学生向量（旧方法，保留用于兼容）
     */
    async generateStudentVectors(studentId) {
        try {
            // 获取学生能力数据
            const capability = await (0, db_1.queryOne)(`SELECT skills, tasks_completed, avg_task_quality, avg_client_satisfaction,
                on_time_delivery_rate, preferred_task_types, opc_openness,
                opc_persistence, opc_creativity
         FROM student_capabilities WHERE student_id = $1`, [studentId]);
            if (!capability) {
                throw new Error(`Student capability ${studentId} not found`);
            }
            // 获取学生基本信息
            const student = await (0, db_1.queryOne)(`SELECT username, bio FROM users WHERE id = $1`, [studentId]);
            // 1. 技能向量 (1536维)
            const skillsText = `技能: ${JSON.stringify(capability.skills)}\n完成任务数: ${capability.tasks_completed}`;
            const skillVector = await this.generateEmbedding(skillsText, 1536);
            // 2. 学习轨迹向量 (512维)
            const trajectoryText = `任务完成数: ${capability.tasks_completed}\n平均质量: ${capability.avg_task_quality}\n客户满意度: ${capability.avg_client_satisfaction}\n准时交付率: ${capability.on_time_delivery_rate}`;
            const trajectoryVector = await this.generateEmbedding(trajectoryText, 512);
            // 3. 质量向量 (512维)
            const qualityText = `质量评分: ${capability.avg_task_quality}\n满意度: ${capability.avg_client_satisfaction}\n可靠性: ${capability.on_time_delivery_rate}`;
            const qualityVector = await this.generateEmbedding(qualityText, 512);
            // 4. 偏好向量 (512维)
            const preferenceText = `偏好任务类型: ${capability.preferred_task_types?.join(', ') || '无'}\nOPC开放性: ${capability.opc_openness}\n坚持性: ${capability.opc_persistence}\n创造力: ${capability.opc_creativity}`;
            const preferenceVector = await this.generateEmbedding(preferenceText, 512);
            // 5. 组合向量 (1536维) - 将所有向量组合
            const combinedVector = await this.generateEmbedding(`${student?.username || ''}\n${student?.bio || ''}\n${skillsText}\n${trajectoryText}\n${qualityText}\n${preferenceText}`, 1536);
            logger_1.default.info(`Generated vectors for student ${studentId}`);
            return {
                skillVector,
                trajectoryVector,
                qualityVector,
                preferenceVector,
                combinedVector
            };
        }
        catch (error) {
            logger_1.default.error(`Failed to generate student vectors for ${studentId}:`, error);
            throw error;
        }
    }
    /**
     * 更新任务embedding到数据库
     */
    /**
     * 更新任务向量到数据库
     * 使用结构化的项目需求摘要生成向量，确保与学生画像摘要在同一语义空间
     */
    async updateTaskEmbedding(taskId) {
        try {
            // 1. 生成结构化的项目需求摘要（与学生画像摘要结构对应）
            const qichengTeacherService = require('./qichengTeacherService').default;
            const requirementSummary = await qichengTeacherService.generateProjectRequirementSummary(taskId);
            // 2. 将摘要转成1024维向量
            const requirementVector = await this.generateEmbedding(requirementSummary, 1024);
            // 3. 保存到数据库
            await (0, db_1.query)(`UPDATE tasks
         SET requirement_vector = $1::vector,
             updated_at = NOW()
         WHERE id = $2`, [
                `[${requirementVector.join(',')}]`,
                taskId
            ]);
            logger_1.default.info(`Updated task requirement vector for ${taskId} using structured summary`);
        }
        catch (error) {
            logger_1.default.error(`Failed to update task embedding for ${taskId}:`, error);
            throw error;
        }
    }
    /**
     * 更新学生向量到数据库
     * 使用结构化的能力画像摘要生成向量，确保与项目需求摘要在同一语义空间
     */
    async updateStudentEmbedding(studentId) {
        try {
            // 1. 生成结构化的能力画像摘要（与项目需求摘要结构对应）
            const profileSummary = await this.generateStudentProfileSummary(studentId);
            // 2. 将摘要转成1024维向量
            const profileVector = await this.generateEmbedding(profileSummary, 1024);
            // 3. 保存到数据库
            await (0, db_1.query)(`UPDATE student_capabilities
         SET profile_vector = $1::vector,
             vector_updated_at = NOW(),
             updated_at = NOW()
         WHERE student_id = $2`, [
                `[${profileVector.join(',')}]`,
                studentId
            ]);
            logger_1.default.info(`Updated student profile vector for ${studentId} using structured summary`);
        }
        catch (error) {
            logger_1.default.error(`Failed to update student embedding for ${studentId}:`, error);
            throw error;
        }
    }
    /**
     * 批量更新所有任务的embedding
     */
    async updateAllTaskEmbeddings() {
        try {
            const tasks = await (0, db_1.query)(`SELECT id FROM tasks WHERE status != 'deleted' ORDER BY created_at DESC`);
            logger_1.default.info(`Starting to update embeddings for ${tasks.length} tasks`);
            for (const task of tasks) {
                try {
                    await this.updateTaskEmbedding(task.id);
                    // 避免API限流
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    logger_1.default.error(`Failed to update embedding for task ${task.id}:`, error);
                    // 继续处理下一个任务
                }
            }
            logger_1.default.info(`Completed updating embeddings for ${tasks.length} tasks`);
        }
        catch (error) {
            logger_1.default.error('Failed to update all task embeddings:', error);
            throw error;
        }
    }
    /**
     * 批量更新所有学生的embedding
     */
    async updateAllStudentEmbeddings() {
        try {
            const students = await (0, db_1.query)(`SELECT student_id FROM student_capabilities ORDER BY created_at DESC`);
            logger_1.default.info(`Starting to update embeddings for ${students.length} students`);
            for (const student of students) {
                try {
                    await this.updateStudentEmbedding(student.student_id);
                    // 避免API限流
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    logger_1.default.error(`Failed to update embedding for student ${student.student_id}:`, error);
                    // 继续处理下一个学生
                }
            }
            logger_1.default.info(`Completed updating embeddings for ${students.length} students`);
        }
        catch (error) {
            logger_1.default.error('Failed to update all student embeddings:', error);
            throw error;
        }
    }
    /**
     * 计算两个向量的余弦相似度
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same dimension');
        }
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += vecB[i] * vecB[i];
        }
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);
        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }
        return dotProduct / (magnitudeA * magnitudeB);
    }
}
exports.default = new VectorGenerationService();
//# sourceMappingURL=vectorGenerationService.js.map