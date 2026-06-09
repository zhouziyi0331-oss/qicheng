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
 * 语言转化层服务
 * 在AI-06导师引擎的五个场景中，增加企业-学生语言的双向转化
 *
 * 五个转化场景：
 * 1. T-01: 任务开始时 - 把企业需求转化为学生能执行的第一步
 * 2. T-02: 学生卡住时 - 把学生的困难重新表述为可探索的方向
 * 3. T-03: 交付物被打回时 - 把企业的模糊反馈转化为具体修改方向
 * 4. T-04: 学生完成里程碑时 - 把学生的成长转化为企业能看懂的价值
 * 5. T-05: 需求方浏览学生时 - 把学生人格标签翻译为商业价值
 */
class LanguageTranslationLayer {
    /**
     * 场景一：任务开始时 - 把企业需求转化为学生能执行的第一步
     * 触发时机：学生接单后30秒
     */
    async translateTaskToFirstSteps(taskId, studentId) {
        try {
            // 获取任务信息
            const task = await (0, db_1.queryOne)(`SELECT title, description FROM tasks WHERE id = $1`, [taskId]);
            // 获取学生画像
            const student = await (0, db_1.queryOne)(`SELECT profile_summary, skills FROM student_capabilities WHERE student_id = $1`, [studentId]);
            // 获取任务翻译（如果存在）
            const translation = await (0, db_1.queryOne)(`SELECT student_friendly_description, what_you_will_do
         FROM task_translations WHERE task_id = $1`, [taskId]);
            const prompt = `你是"启程老师"，帮助学生开始新任务。

## 企业需求
${task?.description || ''}

## 学生能力画像
${student?.profile_summary || '这是一位新学生'}

## 你的任务
把企业需求拆解为学生能立即执行的3个步骤。每步要：
1. 使用学生熟悉的工具和术语
2. 具体可操作（不是"理解需求"，而是"找3个参考案例"）
3. 有明确的产出（"完成XX"而不是"学习XX"）

格式：
第一步：[具体行动]
第二步：[具体行动]
第三步：[具体行动]

直接返回3个步骤，不要其他解释：`;
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet',
                max_tokens: 400,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            return content.text.trim();
        }
        catch (error) {
            logger_1.default.error('Failed to translate task to first steps:', error);
            throw error;
        }
    }
    /**
     * 场景二：学生卡住时 - 把学生的困难重新表述为可探索的方向
     * 触发时机：学生主动求助
     */
    async reframeStudentDifficulty(orderId, studentMessage) {
        try {
            // 获取订单和任务信息
            const order = await (0, db_1.queryOne)(`SELECT task_id, student_id FROM orders WHERE id = $1`, [orderId]);
            const task = await (0, db_1.queryOne)(`SELECT title, description FROM tasks WHERE id = $1`, [order?.task_id]);
            const prompt = `你是"启程老师"，学生遇到困难向你求助。

## 任务背景
${task?.description || ''}

## 学生原话
"${studentMessage}"

## 你的任务
不要直接给答案。把"我做不了"重新表述为"你卡在哪一步"，引导学生自己找到方向。

策略：
1. 先肯定学生已经做的努力
2. 把大问题拆成小问题："你觉得这三个词里，哪一个最让你有画面感？"
3. 给一个小的、可尝试的方向："先从那个开始，出一个草稿"

直接返回你的引导话语（100字内），不要其他解释：`;
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet',
                max_tokens: 300,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            return content.text.trim();
        }
        catch (error) {
            logger_1.default.error('Failed to reframe student difficulty:', error);
            throw error;
        }
    }
    /**
     * 场景三：交付物被打回时 - 把企业的模糊反馈转化为具体修改方向
     * 触发时机：AI审核或企业打回交付物
     */
    async translateRejectionFeedback(orderId, companyFeedback) {
        try {
            // 获取订单信息
            const order = await (0, db_1.queryOne)(`SELECT task_id, student_id FROM orders WHERE id = $1`, [orderId]);
            const task = await (0, db_1.queryOne)(`SELECT title, description FROM tasks WHERE id = $1`, [order?.task_id]);
            const prompt = `你是"启程老师"，企业打回了学生的交付物。

## 任务要求
${task?.description || ''}

## 企业原话
"${companyFeedback}"

## 你的任务
把企业的模糊反馈翻译为学生能操作的修改方向。

结构：
1. 先肯定一个具体做得好的点（不是泛泛的"整体不错"）
2. 指出需要修改的地方（具体到第几张图、哪个模块）
3. 给出可操作的修改建议（"用XX工具做XX调整"）

直接返回你的翻译（150字内），不要其他解释：`;
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet',
                max_tokens: 400,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            return content.text.trim();
        }
        catch (error) {
            logger_1.default.error('Failed to translate rejection feedback:', error);
            throw error;
        }
    }
    /**
     * 场景四：学生完成里程碑时 - 把学生的成长转化为企业能看懂的价值
     * 触发时机：学生完成首单或升级
     */
    async translateStudentGrowthToValue(studentId) {
        try {
            // 获取学生能力数据
            const capability = await (0, db_1.queryOne)(`SELECT profile_summary, tasks_completed, avg_client_satisfaction, skills
         FROM student_capabilities WHERE student_id = $1`, [studentId]);
            // 获取学生最近完成的任务
            const recentTasks = await (0, db_1.query)(`SELECT t.title as task_title, o.client_rating
         FROM orders o
         JOIN tasks t ON o.task_id = t.id
         WHERE o.student_id = $1 AND o.status = 'completed'
         ORDER BY o.completed_at DESC
         LIMIT 5`, [studentId]);
            const prompt = `你是"启程老师"，为学生生成能力描述，让企业看到他的价值。

## 学生数据
- 完成项目数：${capability?.tasks_completed || 0}
- 客户平均评分：${capability?.avg_client_satisfaction || 0}
- 能力画像：${capability?.profile_summary || ''}
- 最近项目：${recentTasks.map(t => t.task_title).join('、')}

## 你的任务
生成一段"个人能力描述"（100-150字），学生可以公开到个人主页。

要求：
1. 用第一人称（"我擅长..."）
2. 突出具体能力和工具（不是"设计能力强"，而是"用AI工具做品牌视觉"）
3. 包含真实数据（完成X个项目，评分X）
4. 提到最大的突破（从X到Y的成长）

直接返回能力描述，不要其他解释：`;
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet',
                max_tokens: 400,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            return content.text.trim();
        }
        catch (error) {
            logger_1.default.error('Failed to translate student growth to value:', error);
            throw error;
        }
    }
    /**
     * 场景五：需求方浏览学生时 - 把学生人格标签翻译为商业价值
     * 触发时机：企业查看匹配推荐的学生列表
     */
    async translatePersonalityToBusinessValue(studentId) {
        try {
            // 获取学生能力画像
            const capability = await (0, db_1.queryOne)(`SELECT profile_summary, personality_style, skills
         FROM student_capabilities WHERE student_id = $1`, [studentId]);
            const prompt = `你是"启程老师"，为企业翻译学生的能力标签。

## 学生画像
- 人格标签：${capability?.personality_style || '未知'}
- 能力摘要：${capability?.profile_summary || ''}

## 你的任务
生成一句话（30字内）的商业价值描述，让企业快速理解这个学生适合什么项目。

格式：擅长[具体能力]，适合[项目类型]。

示例：
- "擅长用画面传递品牌故事，适合需要强视觉辨识度的项目。"
- "擅长快速迭代原型，适合需要短期验证想法的项目。"

直接返回一句话描述，不要其他解释：`;
            const response = await client.messages.create({
                model: 'claude-3-5-sonnet',
                max_tokens: 150,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Unexpected response type');
            }
            return content.text.trim();
        }
        catch (error) {
            logger_1.default.error('Failed to translate personality to business value:', error);
            throw error;
        }
    }
}
exports.default = new LanguageTranslationLayer();
//# sourceMappingURL=languageTranslationLayer.js.map