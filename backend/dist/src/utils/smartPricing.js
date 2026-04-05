"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTaskBudget = calculateTaskBudget;
exports.analyzeTaskRequirements = analyzeTaskRequirements;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = __importDefault(require("./logger"));
const client = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
/**
 * 智能计算任务金额
 * 根据任务复杂度、所需技能、市场行情、学生等级智能定价
 */
async function calculateTaskBudget(taskDescription, taskType, requiredLevel, estimatedHours) {
    // 基础定价规则
    const baseRates = {
        0: 50, // 入门级：50元/小时
        1: 80, // 初级：80元/小时
        2: 120, // 中级：120元/小时
        3: 180, // 高级：180元/小时
    };
    const baseRate = baseRates[requiredLevel] || 50;
    const baseBudget = baseRate * estimatedHours;
    // 开发模式或未配置API Key：使用规则引擎
    if (process.env.NODE_ENV === 'development' || !process.env.ANTHROPIC_API_KEY) {
        return calculateBudgetRuleBased(baseBudget, taskType, requiredLevel, estimatedHours);
    }
    try {
        const prompt = `
你是启程平台的任务定价顾问，帮助企业合理定价任务。

## 任务信息
- 描述: ${taskDescription}
- 类型: ${taskType} (A=内容创作, B=工具开发)
- 所需等级: Lv.${requiredLevel}
- 预计工时: ${estimatedHours}小时

## 基础定价
- 基础时薪: ¥${baseRate}/小时
- 基础预算: ¥${baseBudget}

## 定价规则
1. 内容创作任务通常需要创意和审美，可适当上浮10-20%
2. 工具开发任务需要技术能力，复杂度高的上浮20-30%
3. 高等级任务（Lv.2+）需要经验，建议上浮15-25%
4. 紧急任务（<24小时）建议上浮30-50%
5. 最终金额应为10的倍数，便于结算

请分析并返回JSON格式：
{
  "suggested_budget": <建议金额，整数>,
  "reasoning": "<简短说明定价理由，50字以内>"
}
`;
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }]
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const result = JSON.parse(text);
        return {
            suggestedBudget: Math.round(result.suggested_budget / 10) * 10, // 取整到10的倍数
            reasoning: result.reasoning || '基于任务复杂度和市场行情'
        };
    }
    catch (err) {
        logger_1.default.error('AI budget calculation failed, using rule-based', { error: err.message });
        return calculateBudgetRuleBased(baseBudget, taskType, requiredLevel, estimatedHours);
    }
}
/**
 * 基于规则的金额计算（降级方案）
 */
function calculateBudgetRuleBased(baseBudget, taskType, requiredLevel, estimatedHours) {
    let multiplier = 1.0;
    let reasons = [];
    // 任务类型调整
    if (taskType === 'A') {
        multiplier *= 1.15;
        reasons.push('内容创作需要创意');
    }
    else if (taskType === 'B') {
        multiplier *= 1.25;
        reasons.push('工具开发技术要求高');
    }
    // 等级调整
    if (requiredLevel >= 2) {
        multiplier *= 1.2;
        reasons.push('需要经验丰富的学生');
    }
    // 工时调整（长任务适当降低单价）
    if (estimatedHours > 8) {
        multiplier *= 0.95;
        reasons.push('长期任务');
    }
    const suggestedBudget = Math.round((baseBudget * multiplier) / 10) * 10;
    return {
        suggestedBudget,
        reasoning: reasons.join('，') || '基于市场行情'
    };
}
/**
 * 智能梳理任务要求
 * 分析任务描述，提取关键要求和注意事项
 */
async function analyzeTaskRequirements(taskDescription, taskType) {
    // 开发模式或未配置API Key：使用规则引擎
    if (process.env.NODE_ENV === 'development' || !process.env.ANTHROPIC_API_KEY) {
        return analyzeRequirementsRuleBased(taskDescription, taskType);
    }
    try {
        const prompt = `
分析以下任务描述，提取关键要求：

## 任务描述
${taskDescription}

## 任务类型
${taskType} (A=内容创作, B=工具开发)

请返回JSON格式：
{
  "requirements": ["<关键要求1>", "<关键要求2>", ...],
  "warnings": ["<注意事项1>", "<注意事项2>", ...],
  "estimated_difficulty": <1-5的难度评分>
}

要求：
1. requirements应该是具体的、可验收的要求
2. warnings应该是学生容易忽略的细节
3. 每项不超过20字
`;
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }]
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        const result = JSON.parse(text);
        return {
            requirements: result.requirements || [],
            warnings: result.warnings || [],
            estimatedDifficulty: Math.max(1, Math.min(5, result.estimated_difficulty || 3))
        };
    }
    catch (err) {
        logger_1.default.error('AI requirements analysis failed', { error: err.message });
        return analyzeRequirementsRuleBased(taskDescription, taskType);
    }
}
/**
 * 基于规则的要求分析（降级方案）
 */
function analyzeRequirementsRuleBased(taskDescription, taskType) {
    const requirements = [];
    const warnings = [];
    // 简单关键词匹配
    if (taskDescription.includes('视频')) {
        requirements.push('需要视频制作能力');
        warnings.push('注意视频格式和分辨率');
    }
    if (taskDescription.includes('文案') || taskDescription.includes('文章')) {
        requirements.push('需要文字创作能力');
        warnings.push('注意原创性和语言风格');
    }
    if (taskDescription.includes('AI') || taskDescription.includes('工具')) {
        requirements.push('需要AI工具使用经验');
        warnings.push('确认工具版本和功能');
    }
    // 估算难度
    let difficulty = 2;
    if (taskDescription.length > 200)
        difficulty += 1;
    if (taskType === 'B')
        difficulty += 1;
    return {
        requirements: requirements.length > 0 ? requirements : ['按照描述完成任务'],
        warnings: warnings.length > 0 ? warnings : ['注意交付时间和质量'],
        estimatedDifficulty: Math.min(5, difficulty)
    };
}
//# sourceMappingURL=smartPricing.js.map