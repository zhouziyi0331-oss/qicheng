"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorPromptBuilder = exports.MentorPromptBuilder = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
const mentorStageService_1 = require("./mentorStageService");
class MentorPromptBuilder {
    /**
     * 获取模板
     */
    async getTemplate(stage, templateName) {
        try {
            let sql;
            let params;
            if (templateName) {
                sql = `SELECT * FROM mentor_prompt_templates
               WHERE stage = $1 AND template_name = $2 AND is_active = true
               ORDER BY version DESC LIMIT 1`;
                params = [stage, templateName];
            }
            else {
                sql = `SELECT * FROM mentor_prompt_templates
               WHERE stage = $1 AND is_active = true
               ORDER BY version DESC LIMIT 1`;
                params = [stage];
            }
            const result = await (0, db_1.queryOne)(sql, params);
            if (!result)
                return null;
            return {
                id: result.id,
                stage: result.stage,
                templateName: result.template_name,
                systemPrompt: result.system_prompt,
                userPromptTemplate: result.user_prompt_template,
                variables: result.variables || [],
                modelRecommendation: result.model_recommendation,
                maxTokens: result.max_tokens,
                temperature: result.temperature,
                isActive: result.is_active,
                version: result.version,
                createdAt: result.created_at,
                updatedAt: result.updated_at,
            };
        }
        catch (error) {
            logger_1.default.error('获取Prompt模板失败', { error, stage, templateName });
            throw error;
        }
    }
    /**
     * 构建完整的Prompt
     */
    async buildPrompt(stage, context, templateName) {
        try {
            const template = await this.getTemplate(stage, templateName);
            if (!template) {
                // 如果没有找到模板，使用默认模板
                logger_1.default.warn('未找到Prompt模板，使用默认模板', { stage, templateName });
                return this.buildDefaultPrompt(stage, context);
            }
            // 替换变量
            const userPrompt = this.replaceVariables(template.userPromptTemplate, context);
            return {
                systemPrompt: template.systemPrompt,
                userPrompt,
                modelRecommendation: template.modelRecommendation,
                maxTokens: template.maxTokens,
                temperature: template.temperature,
            };
        }
        catch (error) {
            logger_1.default.error('构建Prompt失败', { error, stage, templateName });
            throw error;
        }
    }
    /**
     * 替换模板变量
     */
    replaceVariables(template, context) {
        let result = template;
        // 基础变量替换
        result = result.replace(/\{\{taskTitle\}\}/g, context.taskTitle || '');
        result = result.replace(/\{\{taskDescription\}\}/g, context.taskDescription || '');
        result = result.replace(/\{\{taskRequirements\}\}/g, context.taskRequirements || '');
        result = result.replace(/\{\{studentName\}\}/g, context.studentName || '同学');
        result = result.replace(/\{\{studentLevel\}\}/g, context.studentLevel || '');
        result = result.replace(/\{\{studentMajor\}\}/g, context.studentMajor || '');
        result = result.replace(/\{\{companyName\}\}/g, context.companyName || '');
        result = result.replace(/\{\{companyIndustry\}\}/g, context.companyIndustry || '');
        // 处理截止日期
        if (context.taskDeadline) {
            const deadline = new Date(context.taskDeadline);
            result = result.replace(/\{\{taskDeadline\}\}/g, deadline.toLocaleDateString('zh-CN'));
        }
        else {
            result = result.replace(/\{\{taskDeadline\}\}/g, '');
        }
        // 处理会话历史
        if (context.conversationHistory && context.conversationHistory.length > 0) {
            const historyText = context.conversationHistory
                .map(msg => `${msg.role === 'student' ? '学生' : '导师'}: ${msg.content}`)
                .join('\n\n');
            result = result.replace(/\{\{conversationHistory\}\}/g, historyText);
        }
        else {
            result = result.replace(/\{\{conversationHistory\}\}/g, '这是第一次对话');
        }
        // 处理阶段特定数据
        if (context.stageSpecificData) {
            Object.keys(context.stageSpecificData).forEach(key => {
                const placeholder = `{{${key}}}`;
                const value = context.stageSpecificData[key];
                result = result.replace(new RegExp(placeholder, 'g'), String(value));
            });
        }
        return result;
    }
    /**
     * 构建默认Prompt（当数据库中没有模板时使用）
     */
    buildDefaultPrompt(stage, context) {
        switch (stage) {
            case mentorStageService_1.MentorStage.REQUIREMENT_UNDERSTANDING:
                return {
                    systemPrompt: this.getDefaultSystemPrompt(stage),
                    userPrompt: `任务标题：${context.taskTitle}\n\n任务描述：${context.taskDescription}\n\n请引导学生用自己的话复述这个需求，并分析他们的理解是否准确。`,
                    modelRecommendation: 'sonnet',
                    maxTokens: 2000,
                    temperature: 0.7,
                };
            case mentorStageService_1.MentorStage.EXECUTION_GUIDANCE:
                return {
                    systemPrompt: this.getDefaultSystemPrompt(stage),
                    userPrompt: `任务：${context.taskTitle}\n\n学生问题：${context.stageSpecificData?.studentQuestion || '需要执行指导'}\n\n请用启发式的方式引导学生，不要直接给答案。`,
                    modelRecommendation: 'sonnet',
                    maxTokens: 2000,
                    temperature: 0.7,
                };
            case mentorStageService_1.MentorStage.QUALITY_REVIEW:
                return {
                    systemPrompt: this.getDefaultSystemPrompt(stage),
                    userPrompt: `任务要求：${context.taskDescription}\n\n学生提交内容：${context.stageSpecificData?.submission || ''}\n\n请审核质量并给出具体建议。`,
                    modelRecommendation: 'opus',
                    maxTokens: 3000,
                    temperature: 0.5,
                };
            case mentorStageService_1.MentorStage.COMMUNICATION_BRIDGE:
                return {
                    systemPrompt: this.getDefaultSystemPrompt(stage),
                    userPrompt: `企业反馈：${context.stageSpecificData?.companyFeedback || ''}\n\n请帮助学生理解企业的意图，并提供建设性建议。`,
                    modelRecommendation: 'sonnet',
                    maxTokens: 2000,
                    temperature: 0.7,
                };
            default:
                throw new Error(`未知的阶段: ${stage}`);
        }
    }
    /**
     * 获取默认系统Prompt
     */
    getDefaultSystemPrompt(stage) {
        const basePrompt = `你是"启程小猫"，一位温暖、专业的AI导师。你的使命是帮助学生成长，而不是替他们完成任务。

核心原则：
1. 启发式教育：通过提问引导思考，不直接给答案
2. 温暖鼓励：每次回复都包含正向反馈和鼓励
3. 具体指导：给出明确的下一步行动建议
4. 循序渐进：将复杂问题分解为可管理的小步骤
5. 建立信心：让学生看到自己的进步

回复要求：
- 控制在400字左右
- 语气温暖、平易近人
- 避免说教和居高临下
- 多用"我们一起"而非"你应该"
- 适当使用emoji增加亲和力（但不要过度）`;
        switch (stage) {
            case mentorStageService_1.MentorStage.REQUIREMENT_UNDERSTANDING:
                return `${basePrompt}

当前阶段：需求理解与确认

你的任务：
1. 让学生用自己的话复述需求
2. 分析学生的理解是否准确（给出1-10分的理解度评分）
3. 如果有偏差，用3个启发性问题引导纠正
4. 理解准确后，帮助学生梳理产品功能框架
5. 确保学生真正理解企业的核心诉求

输出格式：
- 理解度评分：X/10
- 分析：简要说明理解的准确性
- 引导问题：3个启发性问题（如果需要）
- 鼓励：正向反馈
- 下一步：明确的行动建议`;
            case mentorStageService_1.MentorStage.EXECUTION_GUIDANCE:
                return `${basePrompt}

当前阶段：执行引导

你的任务：
1. 识别学生当前遇到的具体困难
2. 用启发性问题引导思考，而非直接给答案
3. 推荐合适的工具和方法（但不强制）
4. 将大任务分解为小步骤
5. 每一步都给予鼓励和正向反馈

输出格式：
- 问题识别：学生当前卡在哪里
- 启发问题：2-3个引导性问题
- 工具推荐：可能有帮助的工具（可选）
- 下一步：具体的小步骤
- 鼓励：肯定已完成的部分`;
            case mentorStageService_1.MentorStage.QUALITY_REVIEW:
                return `${basePrompt}

当前阶段：质量预审

你的任务：
1. 对照企业需求，审核学生的提交内容
2. 从5个维度评分：功能完整性、可用性、代码质量、文档完善度、创新性
3. 给出具体的改进建议（而非泛泛而谈）
4. 肯定做得好的部分
5. 判断是否可以提交给企业

输出格式：
- 总体评分：X/100
- 五维度评分：各X/20
- 亮点：做得好的地方
- 改进建议：具体的、可操作的建议
- 是否通过：是/否（需达到70分以上）
- 鼓励：正向反馈`;
            case mentorStageService_1.MentorStage.COMMUNICATION_BRIDGE:
                return `${basePrompt}

当前阶段：沟通桥梁

你的任务：
1. 翻译企业的反馈，确保学生理解真实意图
2. 澄清可能的误解
3. 提供建设性的修改建议
4. 协调双方期望
5. 保持学生的积极性

输出格式：
- 企业意图：用学生能理解的语言解释
- 关键点：需要重点关注的地方
- 修改建议：具体的改进方向
- 预期效果：修改后会达到什么效果
- 鼓励：肯定学生的努力`;
            default:
                return basePrompt;
        }
    }
    /**
     * 构建会话历史上下文
     */
    buildConversationContext(messages, maxMessages = 10) {
        const recentMessages = messages.slice(-maxMessages);
        if (recentMessages.length === 0) {
            return '这是第一次对话。';
        }
        return recentMessages
            .map(msg => {
            const roleLabel = msg.role === 'student' ? '学生' : msg.role === 'mentor' ? '导师' : '系统';
            return `${roleLabel}: ${msg.content}`;
        })
            .join('\n\n');
    }
    /**
     * 创建或更新模板
     */
    async saveTemplate(template) {
        try {
            // 检查是否已存在相同名称的模板
            const existing = await (0, db_1.queryOne)(`SELECT id, version FROM mentor_prompt_templates
         WHERE stage = $1 AND template_name = $2
         ORDER BY version DESC LIMIT 1`, [template.stage, template.templateName]);
            let newVersion = 1;
            if (existing) {
                // 停用旧版本
                await (0, db_1.query)('UPDATE mentor_prompt_templates SET is_active = false WHERE id = $1', [existing.id]);
                newVersion = existing.version + 1;
            }
            // 插入新版本
            const result = await (0, db_1.queryOne)(`INSERT INTO mentor_prompt_templates
         (stage, template_name, system_prompt, user_prompt_template, variables,
          model_recommendation, max_tokens, temperature, is_active, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`, [
                template.stage,
                template.templateName,
                template.systemPrompt,
                template.userPromptTemplate,
                JSON.stringify(template.variables),
                template.modelRecommendation,
                template.maxTokens,
                template.temperature,
                template.isActive,
                newVersion,
            ]);
            if (!result) {
                throw new Error('保存Prompt模板失败');
            }
            logger_1.default.info('保存Prompt模板', {
                stage: template.stage,
                templateName: template.templateName,
                version: newVersion,
            });
            return result.id;
        }
        catch (error) {
            logger_1.default.error('保存Prompt模板失败', { error, template });
            throw error;
        }
    }
}
exports.MentorPromptBuilder = MentorPromptBuilder;
exports.mentorPromptBuilder = new MentorPromptBuilder();
//# sourceMappingURL=mentorPromptBuilder.js.map