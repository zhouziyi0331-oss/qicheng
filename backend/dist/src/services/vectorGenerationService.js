"use strict";
/**
 * 向量生成服务
 * 使用Claude API生成任务和学生的embedding向量
 * 用于语义匹配引擎
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class VectorGenerationService {
    constructor() {
        this.cache = new Map();
        this.EMBEDDING_DIM = 1536;
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || "",
        });
    }
    /**
     * 生成文本的embedding向量
     * 使用Claude生成语义向量（模拟embedding）
     */
    async generateEmbedding(text) {
        try {
            // 检查缓存
            const cacheKey = `embed_${text.substring(0, 100)}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            // 使用Claude生成语义表示
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [{
                        role: 'user',
                        content: `分析以下文本的语义特征，返回一个表示其核心概念的数值向量（1-10范围内的${this.EMBEDDING_DIM}个数字）：

文本：${text}

请以JSON格式返回：{"vector": [...]}`
                    }],
                temperature: 0.3,
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type from Claude');
            }
            // 解析向量
            const match = content.text.match(/\[[\d\s,.-]+\]/);
            if (!match) {
                // 如果Claude没有返回有效向量，生成随机归一化向量
                const vector = this.generateRandomNormalizedVector(this.EMBEDDING_DIM);
                this.cache.set(cacheKey, vector);
                return vector;
            }
            const vector = JSON.parse(match[0]);
            // 归一化向量
            const normalizedVector = this.normalizeVector(vector);
            // 缓存结果
            this.cache.set(cacheKey, normalizedVector);
            return normalizedVector;
        }
        catch (error) {
            logger_1.default.error('Error generating embedding:', error);
            // 降级：返回基于文本hash的确定性向量
            return this.generateDeterministicVector(text);
        }
    }
    /**
     * 归一化向量（L2范数）
     */
    normalizeVector(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
    }
    /**
     * 生成随机归一化向量
     */
    generateRandomNormalizedVector(dim) {
        const vector = Array.from({ length: dim }, () => Math.random() * 2 - 1);
        return this.normalizeVector(vector);
    }
    /**
     * 基于文本生成确定性向量（降级方案）
     */
    generateDeterministicVector(text) {
        const hash = this.hashString(text);
        const vector = Array.from({ length: this.EMBEDDING_DIM }, (_, i) => {
            const seed = hash + i;
            return Math.sin(seed) * Math.cos(seed * 0.5);
        });
        return this.normalizeVector(vector);
    }
    /**
     * 简单的字符串hash函数
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    /**
     * 生成任务向量
     */
    async generateTaskVectors(task) {
        try {
            logger_1.default.info(`Generating vectors for task: ${task.id}`);
            // 生成标题向量
            const titleEmbedding = await this.generateEmbedding(task.title);
            // 生成描述向量
            const descriptionEmbedding = await this.generateEmbedding(task.description || task.title);
            // 生成组合向量（标题 + 描述 + 技能要求）
            const combinedText = `${task.title} ${task.description} ${JSON.stringify(task.required_skills || {})}`;
            const combinedEmbedding = await this.generateEmbedding(combinedText);
            return {
                title_embedding: titleEmbedding,
                description_embedding: descriptionEmbedding,
                combined_embedding: combinedEmbedding,
            };
        }
        catch (error) {
            logger_1.default.error(`Error generating task vectors for ${task.id}:`, error);
            throw error;
        }
    }
    /**
     * 生成学生向量
     */
    async generateStudentVectors(studentId, capability) {
        try {
            logger_1.default.info(`Generating vectors for student: ${studentId}`);
            // 1. 技能向量 - 基于技能列表
            const skillsText = JSON.stringify(capability.skills || {});
            const skillVector = await this.generateEmbedding(skillsText);
            // 2. 学习轨迹向量 - 基于完成任务数、质量等
            const trajectoryText = `完成任务数: ${capability.tasks_completed}, 平均质量: ${capability.avg_task_quality}`;
            const trajectoryVector = await this.generateEmbedding(trajectoryText);
            // 3. 质量向量 - 基于历史表现
            const qualityText = `质量评分: ${capability.avg_task_quality}, OPC开放性: ${capability.opc_openness}`;
            const qualityVector = await this.generateEmbedding(qualityText);
            // 4. 偏好向量 - 基于偏好的任务类型
            const preferenceText = `偏好任务类型: ${(capability.preferred_task_types || []).join(', ')}`;
            const preferenceVector = await this.generateEmbedding(preferenceText);
            // 5. 组合向量 - 所有信息的综合
            const combinedText = `${skillsText} ${trajectoryText} ${qualityText} ${preferenceText}`;
            const combinedVector = await this.generateEmbedding(combinedText);
            return {
                skill_vector: skillVector,
                trajectory_vector: trajectoryVector.slice(0, 512),
                quality_vector: qualityVector.slice(0, 512),
                preference_vector: preferenceVector.slice(0, 512),
                combined_vector: combinedVector,
            };
        }
        catch (error) {
            logger_1.default.error(`Error generating student vectors for ${studentId}:`, error);
            throw error;
        }
    }
    /**
     * 更新任务的embedding到数据库
     */
    async updateTaskEmbedding(taskId) {
        const client = await db_1.pool.connect();
        try {
            const taskResult = await client.query('SELECT id, title, description, required_skills, track, level FROM tasks WHERE id = $1', [taskId]);
            if (taskResult.rows.length === 0) {
                throw new Error(`Task not found: ${taskId}`);
            }
            const task = taskResult.rows[0];
            const vectors = await this.generateTaskVectors(task);
            await client.query(`UPDATE tasks SET
          title_embedding = $1,
          description_embedding = $2,
          combined_embedding = $3,
          updated_at = NOW()
        WHERE id = $4`, [
                JSON.stringify(vectors.title_embedding),
                JSON.stringify(vectors.description_embedding),
                JSON.stringify(vectors.combined_embedding),
                taskId,
            ]);
            logger_1.default.info(`Updated task embedding: ${taskId}`);
        }
        catch (error) {
            logger_1.default.error(`Error updating task embedding for ${taskId}:`, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 更新学生的embedding到数据库
     */
    async updateStudentEmbedding(studentId) {
        const client = await db_1.pool.connect();
        try {
            const capabilityResult = await client.query('SELECT * FROM student_capabilities WHERE student_id = $1', [studentId]);
            let capability;
            if (capabilityResult.rows.length === 0) {
                logger_1.default.info(`Creating initial capability profile for student: ${studentId}`);
                capability = {
                    student_id: studentId,
                    skills: {},
                    tasks_completed: 0,
                    avg_task_quality: 0.5,
                    preferred_task_types: [],
                };
                await client.query(`INSERT INTO student_capabilities (student_id, skills, tasks_completed, avg_task_quality)
           VALUES ($1, $2, $3, $4)`, [studentId, JSON.stringify(capability.skills), 0, 0.5]);
            }
            else {
                capability = capabilityResult.rows[0];
            }
            const vectors = await this.generateStudentVectors(studentId, capability);
            await client.query(`UPDATE student_capabilities SET
          skill_vector = $1,
          trajectory_vector = $2,
          quality_vector = $3,
          preference_vector = $4,
          combined_vector = $5,
          vector_updated_at = NOW()
        WHERE student_id = $6`, [
                JSON.stringify(vectors.skill_vector),
                JSON.stringify(vectors.trajectory_vector),
                JSON.stringify(vectors.quality_vector),
                JSON.stringify(vectors.preference_vector),
                JSON.stringify(vectors.combined_vector),
                studentId,
            ]);
            logger_1.default.info(`Updated student embedding: ${studentId}`);
        }
        catch (error) {
            logger_1.default.error(`Error updating student embedding for ${studentId}:`, error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    clearCache() {
        this.cache.clear();
        logger_1.default.info('Vector generation cache cleared');
    }
}
exports.default = new VectorGenerationService();
//# sourceMappingURL=vectorGenerationService.js.map