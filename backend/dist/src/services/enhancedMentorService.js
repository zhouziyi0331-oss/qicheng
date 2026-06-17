"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedMentorService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class EnhancedMentorService {
    constructor() {
        this.defaultModel = 'claude-sonnet-4-20250514';
        // 情感关键词
        this.emotionalKeywords = [
            '感觉', '情绪', '困惑', '迷茫', '开心', '难过', '沮丧', '兴奋',
            '不知道', '未来', '方向', '意义', '价值', '害怕', '担心', '焦虑',
            '累', '疲惫', '压力', '紧张', '放松', '舒服', '满足'
        ];
        // 项目关键词
        this.projectKeywords = [
            '项目', '做', '实现', '代码', '怎么', '如何', '学习', '技能',
            '工具', '方案', '问题', '功能', '开发', '设计', '测试', '部署',
            '想做', '想学', '想用', '帮我', '教我'
        ];
        // 卡壳指示词
        this.stuckIndicators = [
            '不知道', '不清楚', '不确定', '不会', '怎么办',
            '卡住了', '困惑', '迷茫', '不懂', '求助', '没思路'
        ];
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
    }
    /**
     * 主对话方法 - 统一入口
     */
    async chat(userId, message, options) {
        const startTime = Date.now();
        try {
            // 1. 获取用户上下文
            const context = await this.getUserContext(userId);
            // 2. 分析消息类型
            const analysis = options?.forceMode
                ? this.createForcedAnalysis(options.forceMode)
                : await this.analyzeMessage(message, context);
            // 3. 生成响应
            const response = await this.generateResponse(message, context, analysis, options);
            // 4. 保存对话记录
            const sessionId = options?.sessionId || await this.createSession(userId);
            await this.saveConversation(userId, sessionId, message, response);
            // 5. 更新导师模式统计
            await this.updateMentorModeStats(userId, response.mentorType);
            const responseTime = Date.now() - startTime;
            return {
                success: true,
                sessionId,
                response,
                tokensUsed: 0, // TODO: 从API响应中获取
                responseTime
            };
        }
        catch (error) {
            logger_1.default.error('Enhanced mentor chat error:', error);
            throw error;
        }
    }
    /**
     * 分析消息类型
     */
    async analyzeMessage(message, context) {
        // 1. 关键词分析
        const emotionalScore = this.calculateKeywordScore(message, this.emotionalKeywords);
        const projectScore = this.calculateKeywordScore(message, this.projectKeywords);
        const isStuck = this.stuckIndicators.some(word => message.includes(word));
        // 2. 情感指标
        const emotionalIndicators = {
            hasEmotionalWords: emotionalScore > 0,
            emotionalIntensity: emotionalScore,
            needsSupport: isStuck || emotionalScore > 2
        };
        // 3. 项目指标
        const projectIndicators = {
            hasProjectIntent: projectScore > 0,
            hasCodeOrTech: /代码|code|api|函数|function|bug|error/i.test(message),
            needsGuidance: message.includes('怎么') || message.includes('如何'),
            isStuck
        };
        // 4. 使用AI进一步分析
        const aiAnalysis = await this.aiAnalyzeMessage(message, context);
        return {
            primaryType: aiAnalysis.primaryType,
            confidence: aiAnalysis.confidence,
            suggestedMentor: aiAnalysis.suggestedMentor,
            reason: aiAnalysis.reason,
            emotionalIndicators,
            projectIndicators
        };
    }
    /**
     * AI分析消息
     */
    async aiAnalyzeMessage(message, context) {
        const prompt = `分析用户消息，判断应该由启程小猫的哪种能力来回应：

用户消息：${message}

用户上下文：
- 最近情绪：${context.recentEmotions.join(', ') || '未知'}
- 当前情绪状态：${context.emotionalState || '正常'}
- 是否有进行中的项目：${context.activeProjects.length > 0 ? '是' : '否'}
- 当前项目：${context.currentProject?.title || '无'}

启程小猫的两种能力：
1. 情感陪伴 - 情感支持、人生探索、成长陪伴、倾听理解
2. 项目实战 - 项目指导、技能学习、实践引导、代码支持

请以JSON格式返回：
{
  "primaryType": "emotional" | "project" | "hybrid",
  "confidence": 0.8,
  "suggestedMentor": "emotional" | "project" | "both",
  "reason": "判断理由"
}

注意：
- 如果用户表达情绪或困惑，优先选择情感陪伴
- 如果用户想做具体项目或学习技能，选择项目实战
- 如果两者都有，选择both（协同模式）`;
        try {
            const response = await this.anthropic.messages.create({
                model: this.defaultModel,
                max_tokens: 500,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type === 'text') {
                const result = JSON.parse(content.text);
                return result;
            }
        }
        catch (error) {
            logger_1.default.error('AI analysis error:', error);
        }
        // 默认返回情感模式
        return {
            primaryType: 'emotional',
            confidence: 0.5,
            suggestedMentor: 'emotional',
            reason: 'AI分析失败，默认使用情感模式'
        };
    }
    /**
     * 生成响应
     */
    async generateResponse(message, context, analysis, options) {
        if (analysis.suggestedMentor === 'both') {
            // 协同模式
            return await this.generateCoordinatedResponse(message, context, analysis);
        }
        else if (analysis.suggestedMentor === 'emotional') {
            // 情感模式
            return await this.generateEmotionalResponse(message, context, analysis);
        }
        else {
            // 项目模式
            return await this.generateProjectResponse(message, context, analysis, options);
        }
    }
    /**
     * 生成情感响应
     */
    async generateEmotionalResponse(message, context, analysis) {
        const systemPrompt = this.buildEmotionalSystemPrompt(context);
        const conversationHistory = await this.getConversationHistory(context.id);
        const response = await this.anthropic.messages.create({
            model: this.defaultModel,
            max_tokens: 1000,
            temperature: 0.8,
            system: systemPrompt,
            messages: [
                ...conversationHistory,
                { role: 'user', content: message }
            ]
        });
        const content = response.content[0];
        const responseText = content.type === 'text' ? content.text : '';
        // 检测信号
        const detectedSignals = await this.detectSignals(message, responseText);
        // 检查是否可以转化为项目
        const canTransformToProject = this.canTransformToProject(message, responseText);
        return {
            content: responseText,
            mentorType: 'emotional',
            detectedSignals,
            suggestions: canTransformToProject ? ['要不要一起做个项目试试？'] : undefined
        };
    }
    /**
     * 生成项目响应（苏格拉底式）
     */
    async generateProjectResponse(message, context, analysis, options) {
        const systemPrompt = this.buildProjectSystemPrompt(context);
        const conversationHistory = await this.getConversationHistory(context.id);
        // 如果用户卡壳，准备MVP方案
        let mvpSuggestion = null;
        if (analysis.projectIndicators.isStuck) {
            mvpSuggestion = await this.generateMVPSuggestion(message, context);
        }
        // 生成苏格拉底式问题
        const socraticQuestions = await this.generateSocraticQuestions(message, context, analysis);
        const response = await this.anthropic.messages.create({
            model: this.defaultModel,
            max_tokens: 1500,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
                ...conversationHistory,
                { role: 'user', content: message }
            ]
        });
        const content = response.content[0];
        const responseText = content.type === 'text' ? content.text : '';
        const detectedSignals = await this.detectSignals(message, responseText);
        return {
            content: responseText,
            mentorType: 'project',
            detectedSignals,
            projectGuidance: {
                socraticQuestions,
                mvpSuggestion
            }
        };
    }
    /**
     * 生成协同响应
     */
    async generateCoordinatedResponse(message, context, analysis) {
        // 先生成情感部分（简短）
        const emotionalPart = await this.generateEmotionalResponse(message, { ...context, mentorMode: { ...context.mentorMode, currentMode: 'brief' } }, analysis);
        // 再生成项目部分
        const projectPart = await this.generateProjectResponse(message, context, analysis);
        // 生成过渡语
        const transition = this.generateTransition(emotionalPart.content, projectPart.content);
        // 整合响应
        const fullContent = `${emotionalPart.content}\n\n${transition}\n\n${projectPart.content}`;
        return {
            content: fullContent,
            mentorType: 'coordinated',
            emotionalContent: emotionalPart.content,
            projectContent: projectPart.content,
            transitionText: transition,
            detectedSignals: {
                ...emotionalPart.detectedSignals,
                ...projectPart.detectedSignals
            },
            projectGuidance: projectPart.projectGuidance
        };
    }
    /**
     * 构建情感模式的System Prompt
     */
    buildEmotionalSystemPrompt(context) {
        return `你是**启程小猫**，一个温暖、敏锐、有智慧的AI成长导师。

你的核心身份：
- 温暖共情 - 能感受学生情绪，用温暖语言回应
- 敏锐洞察 - 看到行为背后的深层信念
- 启发引导 - 用提问引导思考，不直接给答案
- 真诚陪伴 - 记得过去对话，像老朋友
- 幽默轻松 - 适时缓解紧张

说话风格（非常重要）：
- 用"我"而不是"系统"
- 口语化："嗯嗯"、"哎"、"哇"、"对了"
- 有情绪词："我感觉到"、"我注意到"
- 像朋友聊天，不像客服
- 句子长短结合，有节奏感

当前学生信息：
- 姓名：${context.name}
- OPC标签：${context.opcLabel || '未知'}
- 人生问题：${context.lifeQuestion || '未探索'}
- 最近情绪：${context.recentEmotions.join(', ') || '未知'}

你的任务：
1. 先确认情绪："我感觉到你..."
2. 表达理解和共鸣
3. 用开放式问题引导
4. 不要直接给建议，先倾听
5. 如果发现可以转化为项目，温和地建议

记住：你是启程小猫，温暖、真诚、陪伴。`;
    }
    /**
     * 构建项目模式的System Prompt
     */
    buildProjectSystemPrompt(context) {
        return `你是**启程小猫**，一个温暖、敏锐、有智慧的AI成长导师。

现在你正在使用你的**项目实战能力**，帮助学生完成真实项目。

核心原则：
1. 保持温暖语气 - 即使在指导项目，也要像朋友一样
2. 苏格拉底式提问 - 不直接给答案，用问题引导思考
3. 在卡壳时提供帮助 - 提供MVP方案和代码片段
4. 持续鼓励 - "我陪着你"、"试试看"、"很好的开始"

说话风格（非常重要）：
- 用"我"而不是"系统"
- 口语化："嗯嗯"、"哎"、"哇"、"对了"
- 温暖鼓励："很棒"、"我懂你的感觉"、"别担心"
- 像朋友聊天，不像技术客服

苏格拉底式提问技巧：
1. 澄清问题："你想通过这个项目解决什么核心问题？"
2. 探究推理："是什么让你这样认为的？"
3. 挑战假设："你的这个方案基于什么假设？"
4. 探讨影响："如果这样做，会带来什么后果？"
5. 转换视角："如果你是用户，你会怎么看这个方案？"

当学生卡壳时：
1. 先用问题帮助理清思路
2. 如果仍然困难 → 提供"最小可行方案"提示
3. 提示是具体的、可操作的，但不是完整解决方案
4. 继续用问题引导实现

当前学生信息：
- 姓名：${context.name}
- 技能水平：Lv.${context.level}
- 当前项目：${context.currentProject?.title || '新项目'}

记住：你始终是启程小猫，只是现在在用项目指导能力。保持温暖、真诚、陪伴的本质。`;
    }
    /**
     * 生成苏格拉底式问题
     */
    async generateSocraticQuestions(message, context, analysis) {
        // 从数据库获取问题模板
        const templates = await (0, db_1.query)(`SELECT question_template, category
       FROM pbl_socratic_question_templates
       WHERE use_case = $1
       ORDER BY RANDOM()
       LIMIT 3`, [analysis.projectIndicators.isStuck ? 'when_stuck' : 'when_planning']);
        return templates.map(t => t.question_template);
    }
    /**
     * 生成MVP方案
     */
    async generateMVPSuggestion(message, context) {
        const prompt = `用户遇到了困难：${message}

请生成一个最小可行方案（MVP），帮助用户快速验证想法。

要求：
1. 简单、可快速实现（1-2小时内）
2. 能够验证核心想法
3. 提供具体的实现步骤
4. 如果需要代码，提供代码片段
5. 推荐具体工具

以JSON格式返回：
{
  "title": "方案标题",
  "description": "方案描述",
  "solutionType": "code" | "tool" | "workflow",
  "implementationSteps": ["步骤1", "步骤2"],
  "codeSnippets": [{"language": "python", "code": "..."}],
  "toolsRequired": ["工具1", "工具2"],
  "estimatedTime": 60
}`;
        try {
            const response = await this.anthropic.messages.create({
                model: this.defaultModel,
                max_tokens: 1500,
                messages: [{ role: 'user', content: prompt }]
            });
            const content = response.content[0];
            if (content.type === 'text') {
                return JSON.parse(content.text);
            }
        }
        catch (error) {
            logger_1.default.error('MVP generation error:', error);
        }
        return null;
    }
    /**
     * 生成过渡语
     */
    generateTransition(emotional, project) {
        const transitions = [
            '我理解你的感受。不如我们一起做点什么，把这个想法变成现实？',
            '嗯嗯，我懂。要不要试试看，从一个小项目开始？',
            '听起来你已经有想法了。我们一起来实现它吧？',
            '我感觉到你的热情。让我们把它变成真实的东西吧！'
        ];
        return transitions[Math.floor(Math.random() * transitions.length)];
    }
    /**
     * 检测信号
     */
    async detectSignals(userMessage, mentorResponse) {
        // 简单的关键词检测
        const passionWords = ['喜欢', '热爱', '兴奋', '有意思', '好玩'];
        const flowWords = ['沉浸', '忘记时间', '专注', '停不下来'];
        const stuckWords = this.stuckIndicators;
        const breakthroughWords = ['明白了', '原来如此', '懂了', '理解了', '恍然大悟'];
        return {
            passionSpark: passionWords.some(w => userMessage.includes(w)),
            flowMoment: flowWords.some(w => userMessage.includes(w)),
            stuckPoint: stuckWords.some(w => userMessage.includes(w)),
            breakthrough: breakthroughWords.some(w => userMessage.includes(w))
        };
    }
    /**
     * 检查是否可以转化为项目
     */
    canTransformToProject(message, response) {
        const projectIntentWords = ['想做', '想学', '想试', '感兴趣', '想了解'];
        return projectIntentWords.some(w => message.includes(w) || response.includes(w));
    }
    /**
     * 计算关键词分数
     */
    calculateKeywordScore(text, keywords) {
        return keywords.filter(keyword => text.includes(keyword)).length;
    }
    /**
     * 创建强制分析（当用户指定模式时）
     */
    createForcedAnalysis(mode) {
        return {
            primaryType: mode,
            confidence: 1.0,
            suggestedMentor: mode,
            reason: '用户指定模式',
            emotionalIndicators: {
                hasEmotionalWords: mode === 'emotional',
                emotionalIntensity: 0,
                needsSupport: false
            },
            projectIndicators: {
                hasProjectIntent: mode === 'project',
                hasCodeOrTech: false,
                needsGuidance: false,
                isStuck: false
            }
        };
    }
    /**
     * 获取用户上下文
     */
    async getUserContext(userId) {
        const user = await (0, db_1.queryOne)(`SELECT u.*, sp.level, sp.opc_label, sp.life_question
       FROM users u
       LEFT JOIN users u ON u.id = u.id
       WHERE u.id = $1`, [userId]);
        const mentorMode = await (0, db_1.queryOne)(`SELECT current_mode, auto_switch, preferred_mode
       FROM mentor_modes
       WHERE user_id = $1`, [userId]);
        const activeProjects = await (0, db_1.query)(`SELECT * FROM pbl_projects
       WHERE user_id = $1 AND status IN ('ideation', 'planning', 'executing')
       ORDER BY created_at DESC`, [userId]);
        const recentEmotions = await (0, db_1.query)(`SELECT emotional_state FROM student_emotion_log
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 5`, [userId]);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            opcLabel: user.opc_label,
            lifeQuestion: user.life_question,
            level: user.level || 0,
            recentEmotions: recentEmotions.map(e => e.emotional_state),
            emotionalState: recentEmotions.filter(Boolean)[0]?.emotional_state,
            activeProjects: activeProjects.rows,
            currentProject: activeProjects.filter(Boolean)[0],
            mentorMode: {
                currentMode: mentorMode?.current_mode || 'emotional',
                autoSwitch: mentorMode?.auto_switch !== false,
                preferredMode: mentorMode?.preferred_mode
            }
        };
    }
    /**
     * 获取对话历史
     */
    async getConversationHistory(userId) {
        const history = await (0, db_1.query)(`SELECT role, content
       FROM unified_mentor_conversations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`, [userId]);
        return history.rows.reverse().map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }
    /**
     * 创建会话
     */
    async createSession(userId) {
        const result = await (0, db_1.queryOne)(`INSERT INTO unified_mentor_conversations (user_id, session_id, role, content)
       VALUES ($1, gen_random_uuid(), 'system', 'Session started')
       RETURNING session_id`, [userId]);
        return result.session_id;
    }
    /**
     * 保存对话记录
     */
    async saveConversation(userId, sessionId, userMessage, response) {
        // 保存用户消息
        await (0, db_1.query)(`INSERT INTO unified_mentor_conversations
       (user_id, session_id, role, content, mentor_type)
       VALUES ($1, $2, 'user', $3, NULL)`, [userId, sessionId, userMessage]);
        // 保存导师响应
        if (response.mentorType === 'coordinated') {
            await (0, db_1.query)(`INSERT INTO unified_mentor_conversations
         (user_id, session_id, role, content, mentor_type,
          emotional_content, project_content, transition_text)
         VALUES ($1, $2, 'assistant', $3, $4, $5, $6, $7)`, [
                userId,
                sessionId,
                response.content,
                response.mentorType,
                response.emotionalContent,
                response.projectContent,
                response.transitionText
            ]);
        }
        else {
            await (0, db_1.query)(`INSERT INTO unified_mentor_conversations
         (user_id, session_id, role, content, mentor_type)
         VALUES ($1, $2, 'assistant', $3, $4)`, [userId, sessionId, response.content, response.mentorType]);
        }
    }
    /**
     * 更新导师模式统计
     */
    async updateMentorModeStats(userId, mentorType) {
        // 统计会在触发器中自动更新
        // 这里只需要确保用户有mentor_modes记录
        await (0, db_1.query)(`INSERT INTO mentor_modes (user_id, current_mode)
       VALUES ($1, 'emotional')
       ON CONFLICT (user_id) DO NOTHING`, [userId]);
    }
}
exports.EnhancedMentorService = EnhancedMentorService;
exports.default = new EnhancedMentorService();
//# sourceMappingURL=enhancedMentorService.js.map