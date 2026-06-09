"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const client = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
/**
 * 启程老师记忆系统
 * 负责记忆巩固、长期理解更新
 */
class TeacherMemoryService {
    /**
     * 巩固记忆 - 将短期记忆转化为长期理解
     * 应该定期运行（例如每天一次）
     */
    async consolidateMemory(studentId) {
        try {
            logger_1.default.info(`Starting memory consolidation for student ${studentId}`);
            // 获取未巩固的短期记忆
            const shortTermMemories = await (0, db_1.query)(`SELECT * FROM teacher_short_term_memory
         WHERE student_id = $1 AND consolidated = false
         ORDER BY timestamp DESC
         LIMIT 50`, [studentId]);
            if (shortTermMemories.length < 3) {
                logger_1.default.info(`Not enough memories to consolidate for student ${studentId}`);
                return;
            }
            // 获取当前的长期理解
            const longTermMemory = await (0, db_1.queryOne)(`SELECT * FROM teacher_long_term_memory WHERE student_id = $1`, [studentId]);
            // 获取最近的思考记录
            const thinkingRecords = await (0, db_1.query)(`SELECT * FROM teacher_thinking_records
         WHERE student_id = $1
         ORDER BY timestamp DESC
         LIMIT 10`, [studentId]);
            // 获取关键时刻
            const keyMoments = await (0, db_1.query)(`SELECT * FROM teacher_key_moments
         WHERE student_id = $1
         ORDER BY importance DESC, timestamp DESC
         LIMIT 5`, [studentId]);
            // 使用AI分析并更新长期理解
            const updatedUnderstanding = await this.analyzeAndUpdateUnderstanding(shortTermMemories, longTermMemory, thinkingRecords, keyMoments);
            // 更新长期记忆
            await (0, db_1.query)(`UPDATE teacher_long_term_memory
         SET deep_understanding = $1,
             core_strengths = $2,
             growth_areas = $3,
             working_style = $4,
             learning_pattern = $5,
             emotional_triggers = $6,
             last_updated = NOW(),
             confidence_level = $7,
             observation_count = observation_count + $8
         WHERE student_id = $9`, [
                updatedUnderstanding.deepUnderstanding,
                updatedUnderstanding.coreStrengths,
                updatedUnderstanding.growthAreas,
                updatedUnderstanding.workingStyle,
                updatedUnderstanding.learningPattern,
                updatedUnderstanding.emotionalTriggers,
                updatedUnderstanding.confidenceLevel,
                shortTermMemories.length,
                studentId
            ]);
            // 标记短期记忆为已巩固
            await (0, db_1.query)(`UPDATE teacher_short_term_memory
         SET consolidated = true, consolidated_at = NOW()
         WHERE student_id = $1 AND consolidated = false`, [studentId]);
            logger_1.default.info(`Completed memory consolidation for student ${studentId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to consolidate memory:', error);
            throw error;
        }
    }
    /**
     * 分析并更新长期理解
     */
    async analyzeAndUpdateUnderstanding(shortTermMemories, longTermMemory, thinkingRecords, keyMoments) {
        try {
            const prompt = `你是启程老师。你需要更新对一个学生的长期理解。

## 当前的长期理解
${longTermMemory?.deep_understanding || '新学生，尚未建立深度理解'}

核心优势：${longTermMemory?.core_strengths?.join('、') || '待观察'}
成长空间：${longTermMemory?.growth_areas?.join('、') || '待观察'}
工作风格：${longTermMemory?.working_style || '待观察'}
学习模式：${longTermMemory?.learning_pattern || '待观察'}

## 最近的互动记录（${shortTermMemories.length}次）
${shortTermMemories.slice(0, 10).map((m) => `- ${m.student_state}\n  老师回复：${m.teacher_response}`).join('\n')}

## 最近的深度思考
${thinkingRecords.slice(0, 3).map((t) => `- 洞察：${t.insight?.understanding || '无'}`).join('\n')}

## 关键时刻
${keyMoments.map((k) => `- ${k.event_description}：${k.teacher_insight}`).join('\n')}

## 你的任务
基于这些新的观察，更新你对这个学生的长期理解。

要求：
1. **深度理解**：用200字左右的自然语言描述这个学生（不是标签列表）
2. **核心优势**：3-5个具体的优势（不是"能力强"，而是"擅长从混乱中找到结构"）
3. **成长空间**：2-3个需要成长的地方
4. **工作风格**：一句话描述工作风格
5. **学习模式**：一句话描述学习模式
6. **情绪触发点**：什么情况下会焦虑、挫折
7. **信心等级**：0-1，你对这个理解的信心（观察越多，信心越高）

用以下JSON格式输出：
{
  "deepUnderstanding": "200字自然语言描述",
  "coreStrengths": ["优势1", "优势2", "优势3"],
  "growthAreas": ["成长空间1", "成长空间2"],
  "workingStyle": "工作风格描述",
  "learningPattern": "学习模式描述",
  "emotionalTriggers": ["触发点1", "触发点2"],
  "confidenceLevel": 0.7
}

只返回JSON，不要其他文字：`;
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet',
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger_1.default.warn('Failed to parse understanding JSON');
                return this.getDefaultUnderstanding(longTermMemory);
            }
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            logger_1.default.error('Failed to analyze and update understanding:', error);
            return this.getDefaultUnderstanding(longTermMemory);
        }
    }
    /**
     * 默认理解（当AI调用失败时）
     */
    getDefaultUnderstanding(currentMemory) {
        return {
            deepUnderstanding: currentMemory?.deep_understanding || '正在建立对学生的理解',
            coreStrengths: currentMemory?.core_strengths || [],
            growthAreas: currentMemory?.growth_areas || [],
            workingStyle: currentMemory?.working_style || '待观察',
            learningPattern: currentMemory?.learning_pattern || '待观察',
            emotionalTriggers: currentMemory?.emotional_triggers || [],
            confidenceLevel: Math.min((currentMemory?.confidence_level || 0) + 0.1, 1)
        };
    }
    /**
     * 获取学生的长期记忆
     */
    async getLongTermMemory(studentId) {
        try {
            const memory = await (0, db_1.queryOne)(`SELECT * FROM teacher_long_term_memory WHERE student_id = $1`, [studentId]);
            return memory;
        }
        catch (error) {
            logger_1.default.error('Failed to get long term memory:', error);
            return null;
        }
    }
    /**
     * 批量巩固记忆（定时任务）
     */
    async consolidateAllMemories() {
        try {
            // 获取有未巩固记忆的学生
            const students = await (0, db_1.query)(`SELECT DISTINCT student_id
         FROM teacher_short_term_memory
         WHERE consolidated = false
         GROUP BY student_id
         HAVING COUNT(*) >= 3`);
            logger_1.default.info(`Found ${students.length} students with memories to consolidate`);
            for (const student of students) {
                try {
                    await this.consolidateMemory(student.student_id);
                    // 避免API限流
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                catch (error) {
                    logger_1.default.error(`Failed to consolidate memory for student ${student.student_id}:`, error);
                }
            }
            logger_1.default.info('Completed batch memory consolidation');
        }
        catch (error) {
            logger_1.default.error('Failed to consolidate all memories:', error);
        }
    }
    /**
     * 清理旧的短期记忆（已巩固且超过30天）
     */
    async cleanupOldMemories() {
        try {
            const result = await (0, db_1.query)(`DELETE FROM teacher_short_term_memory
         WHERE consolidated = true
           AND consolidated_at < NOW() - INTERVAL '30 days'
         RETURNING id`);
            logger_1.default.info(`Cleaned up ${result.length} old short-term memories`);
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup old memories:', error);
        }
    }
}
exports.default = new TeacherMemoryService();
//# sourceMappingURL=teacherMemoryService.js.map