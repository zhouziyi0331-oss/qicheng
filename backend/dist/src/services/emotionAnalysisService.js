"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emotionAnalysisService = void 0;
const database_1 = require("../config/database");
const logger_1 = __importDefault(require("../utils/logger"));
const claudeService_1 = require("./claudeService");
class EmotionAnalysisService {
    constructor() {
        // 情绪关键词库
        this.emotionKeywords = {
            anxious: {
                words: ['担心', '害怕', '紧张', '不安', '焦虑', '怕', '慌', '忐忑', '不知道怎么办', '会不会'],
                patterns: [/[？?]{2,}/, /[！!]{2,}/, /怎么办/, /完了/, /糟了/],
                weight: 1.0
            },
            frustrated: {
                words: ['烦', '郁闷', '气', '烦躁', '不爽', '讨厌', '受够了', '崩溃', '为什么总是', '又失败了'],
                patterns: [/[！!]{2,}/, /为什么/, /怎么又/, /还是不行/],
                weight: 1.0
            },
            confused: {
                words: ['不懂', '不明白', '不理解', '看不懂', '搞不清', '迷糊', '晕', '懵', '什么意思', '怎么回事'],
                patterns: [/[？?]{2,}/, /是什么/, /怎么/, /为什么/],
                weight: 0.8
            },
            excited: {
                words: ['太好了', '棒', '厉害', '成功了', '搞定了', '终于', '哈哈', '耶', '开心', '兴奋'],
                patterns: [/[！!]+/, /哈哈/, /耶/, /✌️|👍|🎉/],
                weight: 1.0
            },
            confident: {
                words: ['我会', '我能', '我可以', '没问题', '简单', '容易', '掌握了', '理解了', '明白了', '懂了'],
                patterns: [/我[会能可以]/, /没问题/, /OK|ok/],
                weight: 0.9
            },
            overwhelmed: {
                words: ['太多了', '太复杂', '太难', '做不完', '来不及', '压力大', '受不了', '太累', '顾不过来'],
                patterns: [/太[多难复杂]/, /[做不完|来不及]/, /一堆/],
                weight: 1.0
            },
            proud: {
                words: ['我做到了', '我完成了', '我解决了', '成就感', '骄傲', '自豪', '进步了', '突破了'],
                patterns: [/我[做完解决].*了/, /终于.*成功/],
                weight: 1.0
            }
        };
    }
    /**
     * 分析学生消息中的情绪
     */
    async analyzeEmotion(studentId, taskId, sessionId, messageId, content, context) {
        try {
            // 1. 基于规则的快速检测
            const ruleBasedResult = this.detectEmotionByRules(content);
            // 2. 如果规则检测置信度较低，使用AI增强分析
            let finalResult = ruleBasedResult;
            if (ruleBasedResult.confidence < 0.7) {
                const aiResult = await this.detectEmotionByAI(content, context);
                finalResult = this.mergeResults(ruleBasedResult, aiResult);
            }
            // 3. 记录情绪日志
            await this.logEmotion(studentId, taskId, sessionId, messageId, finalResult, content, context);
            // 4. 更新对话上下文
            await this.updateConversationContext(sessionId, finalResult);
            return finalResult;
        }
        catch (error) {
            logger_1.default.error('情绪分析失败', { error, studentId, content });
            // 返回中性情绪
            return {
                emotion: 'neutral',
                intensity: 0.5,
                signals: [],
                confidence: 0.5
            };
        }
    }
    /**
     * 基于规则的情绪检测
     */
    detectEmotionByRules(content) {
        const scores = {};
        const signals = {};
        // 遍历每种情绪
        for (const [emotion, config] of Object.entries(this.emotionKeywords)) {
            scores[emotion] = 0;
            signals[emotion] = [];
            // 检查关键词
            for (const word of config.words) {
                if (content.includes(word)) {
                    scores[emotion] += config.weight;
                    signals[emotion].push({
                        word,
                        weight: config.weight,
                        category: 'keyword'
                    });
                }
            }
            // 检查模式
            for (const pattern of config.patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    scores[emotion] += config.weight * 0.5;
                    signals[emotion].push({
                        word: matches[0],
                        weight: config.weight * 0.5,
                        category: 'pattern'
                    });
                }
            }
        }
        // 找出得分最高的情绪
        let maxEmotion = 'neutral';
        let maxScore = 0;
        for (const [emotion, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                maxEmotion = emotion;
            }
        }
        // 计算强度和置信度
        const intensity = Math.min(maxScore / 3, 1.0); // 归一化到0-1
        const confidence = signals[maxEmotion]?.length > 0 ? 0.8 : 0.3;
        return {
            emotion: maxEmotion,
            intensity,
            signals: signals[maxEmotion] || [],
            confidence
        };
    }
    /**
     * 使用AI进行情绪检测（用于复杂情况）
     */
    async detectEmotionByAI(content, context) {
        const prompt = `分析以下学生消息中的情绪状态。

学生消息：
${content}

${context ? `上下文：\n${context}` : ''}

请从以下情绪中选择最符合的一个：
- anxious（焦虑）：担心、害怕、紧张、不安
- frustrated（沮丧）：烦躁、郁闷、受挫
- confused（困惑）：不理解、不明白、迷糊
- excited（兴奋）：开心、激动、有成就感
- confident（自信）：有把握、确定、掌握了
- overwhelmed（不堪重负）：压力大、太多、太复杂
- proud（自豪）：骄傲、有成就感、完成了挑战
- neutral（中性）：平静、正常交流

请以JSON格式返回：
{
  "emotion": "情绪类型",
  "intensity": 0.0-1.0的强度值,
  "reasoning": "判断理由",
  "signals": ["信号词1", "信号词2"]
}`;
        try {
            const response = await claudeService_1.claudeService.chat([{ role: 'user', content: prompt }], {
                model: 'claude-haiku-4-5', // 使用Haiku降低成本
                maxTokens: 500,
                temperature: 0.3
            });
            const result = JSON.parse(response);
            return {
                emotion: result.emotion,
                intensity: result.intensity,
                signals: result.signals.map((word) => ({
                    word,
                    weight: 1.0,
                    category: 'ai_detected'
                })),
                confidence: 0.9
            };
        }
        catch (error) {
            logger_1.default.error('AI情绪检测失败', { error });
            return {
                emotion: 'neutral',
                intensity: 0.5,
                signals: [],
                confidence: 0.3
            };
        }
    }
    /**
     * 合并规则检测和AI检测结果
     */
    mergeResults(ruleResult, aiResult) {
        // 如果两者一致，提高置信度
        if (ruleResult.emotion === aiResult.emotion) {
            return {
                emotion: ruleResult.emotion,
                intensity: (ruleResult.intensity + aiResult.intensity) / 2,
                signals: [...ruleResult.signals, ...aiResult.signals],
                confidence: Math.max(ruleResult.confidence, aiResult.confidence)
            };
        }
        // 如果不一致，选择置信度更高的
        return ruleResult.confidence >= aiResult.confidence ? ruleResult : aiResult;
    }
    /**
     * 记录情绪到数据库
     */
    async logEmotion(studentId, taskId, sessionId, messageId, result, triggerContent, contextSummary) {
        const query = `
      INSERT INTO student_emotion_log (
        student_id, task_id, session_id, message_id,
        detected_emotion, emotion_intensity, emotion_signals,
        trigger_content, context_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
        await database_1.pool.query(query, [
            studentId,
            taskId,
            sessionId,
            messageId,
            result.emotion,
            result.intensity,
            JSON.stringify(result.signals),
            triggerContent,
            contextSummary
        ]);
    }
    /**
     * 更新对话上下文
     */
    async updateConversationContext(sessionId, result) {
        const query = `
      INSERT INTO mentor_conversation_context (
        session_id, current_emotion, current_confidence_level, updated_at
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (session_id)
      DO UPDATE SET
        current_emotion = $2,
        current_confidence_level = CASE
          WHEN $2 IN ('confident', 'excited', 'proud') THEN LEAST(mentor_conversation_context.current_confidence_level + 0.1, 1.0)
          WHEN $2 IN ('anxious', 'frustrated', 'overwhelmed') THEN GREATEST(mentor_conversation_context.current_confidence_level - 0.1, 0.0)
          ELSE mentor_conversation_context.current_confidence_level
        END,
        needs_encouragement = $2 IN ('anxious', 'frustrated', 'overwhelmed'),
        needs_challenge = $2 IN ('confident', 'excited'),
        needs_simplification = $2 IN ('confused', 'overwhelmed'),
        updated_at = NOW()
    `;
        await database_1.pool.query(query, [sessionId, result.emotion, result.intensity]);
    }
    /**
     * 获取情绪响应策略
     */
    async getResponseStrategy(emotion) {
        try {
            const query = `
        SELECT
          emotion,
          response_approach,
          tone_guidelines,
          example_phrases,
          guidance_adjustments
        FROM emotion_response_strategies
        WHERE emotion = $1
      `;
            const result = await database_1.pool.query(query, [emotion]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                emotion: row.emotion,
                responseApproach: row.response_approach,
                toneGuidelines: row.tone_guidelines,
                examplePhrases: row.example_phrases,
                guidanceAdjustments: row.guidance_adjustments
            };
        }
        catch (error) {
            logger_1.default.error('获取情绪响应策略失败', { error, emotion });
            return null;
        }
    }
    /**
     * 获取学生最近的情绪历史
     */
    async getRecentEmotions(studentId, limit = 10) {
        try {
            const query = `
        SELECT detected_emotion, emotion_intensity, created_at
        FROM student_emotion_log
        WHERE student_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
            const result = await database_1.pool.query(query, [studentId, limit]);
            return result.rows.map(row => ({
                emotion: row.detected_emotion,
                intensity: row.emotion_intensity,
                createdAt: row.created_at
            }));
        }
        catch (error) {
            logger_1.default.error('获取情绪历史失败', { error, studentId });
            return [];
        }
    }
    /**
     * 获取当前对话上下文
     */
    async getConversationContext(sessionId) {
        try {
            const query = `
        SELECT *
        FROM mentor_conversation_context
        WHERE session_id = $1
      `;
            const result = await database_1.pool.query(query, [sessionId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.default.error('获取对话上下文失败', { error, sessionId });
            return null;
        }
    }
}
exports.emotionAnalysisService = new EmotionAnalysisService();
//# sourceMappingURL=emotionAnalysisService.js.map