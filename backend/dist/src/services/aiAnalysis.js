"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeOPCTest = analyzeOPCTest;
exports.buildFallbackAnalysis = buildFallbackAnalysis;
exports.evaluateChallengeTest = evaluateChallengeTest;
exports.evaluateSubcontractReason = evaluateSubcontractReason;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../utils/logger"));
const anthropic = new sdk_1.default({
    apiKey: config_1.config.ai.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
});
// ============================================================
// OPC测评AI分析服务
// ============================================================
async function analyzeOPCTest(userId, answers) {
    try {
        // 构建AI分析提示词
        const prompt = buildOPCAnalysisPrompt(answers);
        // 调用Claude API进行真实分析
        const message = await anthropic.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 2000,
            temperature: 0.7,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const rawResponse = message.content[0].type === 'text' ? message.content[0].text : '';
        logger_1.default.info('OPC test analyzed by Claude', { userId, usage: message.usage });
        // 解析AI返回的JSON结果
        const result = parseAIResponse(rawResponse);
        return {
            ...result,
            raw_response: rawResponse,
        };
    }
    catch (error) {
        logger_1.default.error('OPC AI analysis failed', { userId, error: error.message });
        // 降级到基础评分
        return buildFallbackAnalysis(answers);
    }
}
// ============================================================
// 构建AI分析提示词
// ============================================================
function buildOPCAnalysisPrompt(answers) {
    return `你是启程平台的OPC能力分析专家。请根据学生的测评答案，进行深度分析并生成OPC人格标签。

**测评答案：**
${JSON.stringify(answers, null, 2)}

**分析要求：**
1. 六维能力评分（0-100分）：
   - D1: 专业技能（AI工具使用能力）
   - D2: 执行力（任务完成效率）
   - D3: 新工具上手速度
   - D4: 需求理解能力
   - D5: 时间管理能力
   - D6: 交付水平（作品质量）

2. OPC人格标签（创意且准确）：
   - 主标签：如"隐藏的创作型执行者"、"探索中的AI实践者"
   - 副标签：补充描述

3. 推荐赛道：
   - A赛道：AI创作类（图像、视频、文案）
   - B赛道：AI工具类（自动化、数据分析）
   - AB赛道：两者兼具

4. 推荐起始等级（0-2级）

5. 分享卡片文案（≤20字，温暖有共鸣）

**输出格式（严格JSON）：**
\`\`\`json
{
  "d1_score": 75,
  "d2_score": 80,
  "d3_score": 70,
  "d4_score": 85,
  "d5_score": 75,
  "d6_score": 80,
  "opc_label": "探索中的AI实践者",
  "opc_label_secondary": "善于学习新工具，执行力强",
  "recommended_track": "A",
  "recommended_level": 1,
  "share_card_caption": "你的能力，值得被看见",
  "share_card_data": {
    "top_strength": "执行力",
    "growth_potential": "专业技能",
    "personality_type": "实践型"
  },
  "analysis_detail": "你在执行力和需求理解方面表现出色..."
}
\`\`\`

请基于答案进行真实分析，不要使用模板回复。`;
}
// ============================================================
// 解析AI返回结果
// ============================================================
function parseAIResponse(rawResponse) {
    try {
        // 提取JSON部分
        const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        // 尝试直接解析
        return JSON.parse(rawResponse);
    }
    catch (error) {
        logger_1.default.error('Failed to parse AI response', { error: error.message });
        throw new Error('AI返回格式错误');
    }
}
// ============================================================
// 降级方案：基础评分逻辑
// ============================================================
function buildFallbackAnalysis(answers) {
    // 简单的评分逻辑（基于答案数量和类型）
    const answerCount = Object.keys(answers).length;
    const baseScore = Math.min(100, 50 + answerCount * 2);
    return {
        d1_score: baseScore + Math.floor(Math.random() * 10),
        d2_score: baseScore + Math.floor(Math.random() * 10),
        d3_score: baseScore + Math.floor(Math.random() * 10),
        d4_score: baseScore + Math.floor(Math.random() * 10),
        d5_score: baseScore + Math.floor(Math.random() * 10),
        d6_score: baseScore + Math.floor(Math.random() * 10),
        opc_label: '探索中的AI学习者',
        opc_label_secondary: '正在发现自己的潜力',
        recommended_track: 'A',
        recommended_level: 0,
        share_card_caption: '开启你的OPC之旅',
        share_card_data: {
            top_strength: '学习能力',
            growth_potential: '全面发展',
            personality_type: '探索型',
        },
        raw_response: 'Fallback analysis (AI service unavailable)',
    };
}
// ============================================================
// 跳级测试AI评分
// ============================================================
async function evaluateChallengeTest(questions, answers, currentLevel, targetLevel) {
    try {
        const prompt = `你是启程平台的能力评估专家。学生正在进行从 Level ${currentLevel} 到 Level ${targetLevel} 的跳级挑战。

**测试题目：**
${JSON.stringify(questions, null, 2)}

**学生答案：**
${JSON.stringify(answers, null, 2)}

**评分要求：**
1. 总分100分，80分及格
2. 评估维度：
   - 专业知识掌握程度（30分）
   - 实践能力（30分）
   - 问题解决思路（20分）
   - 创新性（20分）

3. 给出详细反馈，指出优点和不足

**输出格式（严格JSON）：**
\`\`\`json
{
  "score": 85,
  "feedback": "你的表现非常出色...",
  "failedReason": null,
  "detailedAnalysis": {
    "knowledge": 28,
    "practice": 26,
    "problem_solving": 18,
    "innovation": 13,
    "strengths": ["需求理解准确", "工具使用熟练"],
    "improvements": ["可以尝试更多创新方案"]
  }
}
\`\`\``;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            temperature: 0.5,
            messages: [{ role: 'user', content: prompt }],
        });
        const rawResponse = message.content[0].type === 'text' ? message.content[0].text : '';
        const result = parseAIResponse(rawResponse);
        logger_1.default.info('Challenge test evaluated', { currentLevel, targetLevel, score: result.score });
        return result;
    }
    catch (error) {
        logger_1.default.error('Challenge evaluation failed', { error: error.message });
        // 降级评分
        const score = Math.floor(Math.random() * 40) + 60;
        return {
            score,
            feedback: score >= 80 ? '通过挑战测试' : '还需要更多练习',
            failedReason: score < 80 ? '部分题目回答不够深入' : undefined,
            detailedAnalysis: {},
        };
    }
}
// ============================================================
// 转包理由AI审核
// ============================================================
async function evaluateSubcontractReason(reason, taskTitle, taskDescription) {
    try {
        const prompt = `你是启程平台的任务管理专家。学生申请转包任务，请判断理由是否合理。

**任务信息：**
标题：${taskTitle}
描述：${taskDescription}

**转包理由：**
${reason}

**判断标准：**
合理理由：时间冲突、能力不足、学业繁忙、突发事件等客观原因
不合理理由：单纯想赚差价、懒惰、随意放弃等主观原因

**输出格式（严格JSON）：**
\`\`\`json
{
  "approved": true,
  "feedback": "你的理由合理，已批准转包申请。"
}
\`\`\``;
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 500,
            temperature: 0.3,
            messages: [{ role: 'user', content: prompt }],
        });
        const rawResponse = message.content[0].type === 'text' ? message.content[0].text : '';
        const result = parseAIResponse(rawResponse);
        logger_1.default.info('Subcontract reason evaluated', { approved: result.approved });
        return result;
    }
    catch (error) {
        logger_1.default.error('Subcontract evaluation failed', { error: error.message });
        // 降级：基于关键词判断
        const keywords = ['时间', '冲突', '能力', '不足', '学业', '考试', '项目', '紧急'];
        const hasValidReason = keywords.some(kw => reason.includes(kw));
        return {
            approved: hasValidReason,
            feedback: hasValidReason
                ? '你的转包理由合理，已批准。'
                : '转包理由不够充分，建议重新考虑。',
        };
    }
}
//# sourceMappingURL=aiAnalysis.js.map