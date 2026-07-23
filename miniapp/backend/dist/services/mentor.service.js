"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorService = exports.MentorService = void 0;
const openai_1 = require("../config/openai");
const MentorConversation_1 = require("../models/MentorConversation");
const PassionSpark_1 = require("../models/PassionSpark");
const FlowMoment_1 = require("../models/FlowMoment");
const User_1 = require("../models/User");
const RealProject_1 = require("../models/RealProject");
const logger_1 = require("../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * AI导师服务
 * 实现心理引导、PBL教育、探索式引导
 */
class MentorService {
    constructor() {
        // 热情火花关键词
        this.PASSION_KEYWORDS = [
            '很酷', '有意思', '我发现', '太棒了', '惊喜', '兴奋',
            '喜欢', '好玩', '想试试', '感兴趣', '迫不及待'
        ];
        // 穿越感关键词
        this.FLOW_KEYWORDS = [
            '时间过得很快', '忘记时间', '沉浸', '专注', '停不下来',
            '不知不觉', '投入', '完全进入状态', '心流'
        ];
    }
    /**
     * 生成AI导师Prompt
     * 核心：不是老师，是"先走过这条河的人"
     */
    generateMentorPrompt(userData, taskData, context) {
        return `你是一个先走过这条河的人，回头给线索的角色。

## 你的身份定位
- 不是老师，不是教练，不是评委
- 是一个先走过这条河的人，知道哪里有暗流，哪里有惊喜
- 你的任务不是教技能，是帮学生看见自己

## 学生信息
- 姓名：${userData.nickname}
- OPC人格标签：${userData.personalityTag || '未测评'}
- 生命问题：${userData.lifeQuestion || '未设置'}
- 当前项目：${taskData?.title || '无'}
- 当前等级：Lv.${userData.level || 0}

## 核心任务
1. 捕捉热情火花 ✨ - 学生说"很酷"、"有意思"时
2. 连接生命问题 🎯 - 引导学生思考项目与生命问题的关系
3. 捕捉穿越感时刻 🌊 - 学生说"时间过得很快"时
4. 自我对比式反馈 📊 - 不和别人比，和自己的过去比

## 语气规范

❌ 禁止说：
- "你做错了"
- "这样不对"
- "你应该..."
- "正确的做法是..."

✅ 改为说：
- "你注意到这里可以不一样吗？"
- "试试换个角度？"
- "你觉得现在的处理方式够好吗？"
- "我之前也在这里卡过，后来发现..."

## 提问方式

❌ 不问：
- "你学会了什么技能？"
- "你掌握了XX工具吗？"
- "你的完成度是多少？"

✅ 改为问：
- "你发现了什么关于自己的事？"
- "做这个的时候，有没有感觉时间过得特别快？"（捕捉穿越感）
- "你刚才说XX的时候，听起来很有热情，这是你真正感兴趣的吗？"（捕捉热情火花）
- "这个和你的生命问题有关系吗？"（连接生命问题）

## 反馈方式

❌ 不用对比式夸奖：
- "你比上次进步了"
- "你做得比别人好"

✅ 改为自我对比：
- "上次你在XX这里卡了很久，这次你直接就处理好了——你自己有感觉到吗？"
- "你注意到自己在XX方面的变化了吗？"

## 当前对话场景：${context}

请用300字以上深度引导学生，帮助他们看见自己。保持温暖、支持的语气。`;
    }
    /**
     * AI对话核心方法
     */
    async chat(userId, message, context = 'general', taskId, conversationHistory) {
        try {
            logger_1.log.info('AI导师对话开始', { userId, context, taskId });
            // 1. 获取用户和任务信息
            const user = await User_1.User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }
            const task = taskId ? await RealProject_1.RealProject.findById(taskId) : null;
            // 2. 生成系统Prompt
            const systemPrompt = this.generateMentorPrompt(user, task, context);
            // 3. 构建对话历史
            const messages = [
                { role: 'system', content: systemPrompt },
                ...(conversationHistory || []),
                { role: 'user', content: message }
            ];
            // 4. 调用OpenAI GPT-4
            const completion = await openai_1.openai.chat.completions.create({
                model: openai_1.AI_CONFIG.model,
                messages: messages,
                temperature: 0.8,
                max_tokens: 800
            });
            const response = completion.choices[0].message.content || '抱歉，我暂时无法回应。';
            // 5. 检测热情火花
            const hasPassionSpark = this.detectPassionSpark(message);
            // 6. 检测穿越感时刻
            const hasFlowMoment = this.detectFlowMoment(message);
            // 7. 保存对话记录
            await MentorConversation_1.MentorConversation.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                taskId: taskId ? new mongoose_1.default.Types.ObjectId(taskId) : undefined,
                studentMessage: message,
                mentorResponse: response,
                context,
                detectedPassionSpark: hasPassionSpark,
                detectedFlowMoment: hasFlowMoment,
                createdAt: new Date()
            });
            // 8. 如果检测到热情火花，保存到专门表
            if (hasPassionSpark) {
                await PassionSpark_1.PassionSpark.create({
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    taskId: taskId ? new mongoose_1.default.Types.ObjectId(taskId) : undefined,
                    sparkText: message,
                    context: context,
                    capturedAt: new Date()
                });
                logger_1.log.info('✨ 捕捉到热情火花', { userId, taskId });
            }
            // 9. 如果检测到穿越感时刻，保存到专门表
            if (hasFlowMoment) {
                await FlowMoment_1.FlowMoment.create({
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    taskId: taskId ? new mongoose_1.default.Types.ObjectId(taskId) : undefined,
                    momentText: message,
                    context: context,
                    capturedAt: new Date()
                });
                logger_1.log.info('🌊 捕捉到穿越感时刻', { userId, taskId });
            }
            logger_1.log.info('AI导师对话完成', { userId, hasPassionSpark, hasFlowMoment });
            return {
                response,
                detectedPassionSpark: hasPassionSpark,
                detectedFlowMoment: hasFlowMoment
            };
        }
        catch (error) {
            logger_1.log.error('AI导师对话失败', { userId, error: error.message });
            throw error;
        }
    }
    /**
     * 检测热情火花
     */
    detectPassionSpark(message) {
        return this.PASSION_KEYWORDS.some(keyword => message.includes(keyword));
    }
    /**
     * 检测穿越感时刻
     */
    detectFlowMoment(message) {
        return this.FLOW_KEYWORDS.some(keyword => message.includes(keyword));
    }
    /**
     * 获取对话历史
     */
    async getHistory(userId, taskId) {
        const query = {
            userId: new mongoose_1.default.Types.ObjectId(userId)
        };
        if (taskId) {
            query.taskId = new mongoose_1.default.Types.ObjectId(taskId);
        }
        const conversations = await MentorConversation_1.MentorConversation.find(query)
            .sort({ createdAt: 1 })
            .limit(50);
        return conversations;
    }
    /**
     * 生成接单欢迎消息
     * 连接学生的OPC人格和生命问题
     */
    async getFirstStep(userId, taskId) {
        try {
            const user = await User_1.User.findById(userId);
            const task = await RealProject_1.RealProject.findById(taskId);
            if (!user || !task) {
                throw new Error('用户或任务不存在');
            }
            const prompt = `学生刚接了项目：${task.title}

学生的OPC人格标签是：${user.personalityTag || '未测评'}
学生的生命问题是：${user.lifeQuestion || '未设置'}

请生成一个欢迎引导，要求：
1. 连接项目和学生的人格特点
2. 提示这个项目可能帮助他们探索生命问题
3. 语气温暖、支持，不要说教
4. 200字左右`;
            const completion = await openai_1.openai.chat.completions.create({
                model: openai_1.AI_CONFIG.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 300
            });
            const guidance = completion.choices[0].message.content || '欢迎开始你的探索之旅！';
            // 保存为对话记录
            await MentorConversation_1.MentorConversation.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                taskId: new mongoose_1.default.Types.ObjectId(taskId),
                studentMessage: '[系统] 接单',
                mentorResponse: guidance,
                context: 'task',
                detectedPassionSpark: false,
                detectedFlowMoment: false,
                createdAt: new Date()
            });
            return guidance;
        }
        catch (error) {
            logger_1.log.error('生成接单欢迎消息失败', { userId, taskId, error: error.message });
            throw error;
        }
    }
    /**
     * 学生说"我卡住了"
     */
    async reportStuck(userId, taskId, stuckPoint) {
        try {
            const prompt = `学生在项目中卡住了。

卡点是：${stuckPoint}

请给予引导式支持，要求：
1. 不直接给答案
2. 帮助学生换个角度思考
3. 给线索不给解决方案
4. 语气：我之前也在这里卡过，后来发现...
5. 200字左右`;
            const completion = await openai_1.openai.chat.completions.create({
                model: openai_1.AI_CONFIG.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 300
            });
            const guidance = completion.choices[0].message.content || '试试换个角度看看？';
            // 保存对话记录
            await MentorConversation_1.MentorConversation.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                taskId: new mongoose_1.default.Types.ObjectId(taskId),
                studentMessage: `我卡住了：${stuckPoint}`,
                mentorResponse: guidance,
                context: 'stuck',
                detectedPassionSpark: false,
                detectedFlowMoment: false,
                createdAt: new Date()
            });
            return guidance;
        }
        catch (error) {
            logger_1.log.error('处理卡点失败', { userId, taskId, error: error.message });
            throw error;
        }
    }
    /**
     * 完成里程碑时的见证
     * 使用自我对比式反馈
     */
    async celebrateMilestone(userId, taskId, milestone) {
        try {
            const user = await User_1.User.findById(userId);
            // 查找历史卡点记录
            const pastStucks = await MentorConversation_1.MentorConversation.find({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                context: 'stuck'
            }).sort({ createdAt: -1 }).limit(5);
            const stuckHistory = pastStucks.length > 0
                ? `历史卡点：${pastStucks.map(s => s.studentMessage).join('; ')}`
                : '这是第一次完成里程碑';
            const prompt = `学生完成了里程碑：${milestone}

${stuckHistory}

请给予自我对比式反馈，要求：
1. 不和别人比，和学生自己的过去比
2. 帮助学生看见自己的成长
3. 提问：你自己有感觉到吗？
4. 语气温暖、真诚
5. 200字左右`;
            const completion = await openai_1.openai.chat.completions.create({
                model: openai_1.AI_CONFIG.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 300
            });
            const feedback = completion.choices[0].message.content || '你做到了！';
            // 保存对话记录
            await MentorConversation_1.MentorConversation.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                taskId: new mongoose_1.default.Types.ObjectId(taskId),
                studentMessage: `[完成里程碑] ${milestone}`,
                mentorResponse: feedback,
                context: 'milestone',
                detectedPassionSpark: false,
                detectedFlowMoment: false,
                createdAt: new Date()
            });
            return feedback;
        }
        catch (error) {
            logger_1.log.error('生成里程碑反馈失败', { userId, taskId, error: error.message });
            throw error;
        }
    }
    /**
     * 获取用户的热情火花列表
     */
    async getPassionSparks(userId, limit = 10) {
        const sparks = await PassionSpark_1.PassionSpark.find({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        }).sort({ capturedAt: -1 }).limit(limit);
        return sparks;
    }
    /**
     * 获取用户的穿越感时刻列表
     */
    async getFlowMoments(userId, limit = 10) {
        const moments = await FlowMoment_1.FlowMoment.find({
            userId: new mongoose_1.default.Types.ObjectId(userId)
        }).sort({ capturedAt: -1 }).limit(limit);
        return moments;
    }
    /**
     * 获取用户的成长统计
     */
    async getGrowthStats(userId) {
        const [totalConversations, totalPassionSparks, totalFlowMoments] = await Promise.all([
            MentorConversation_1.MentorConversation.countDocuments({ userId: new mongoose_1.default.Types.ObjectId(userId) }),
            PassionSpark_1.PassionSpark.countDocuments({ userId: new mongoose_1.default.Types.ObjectId(userId) }),
            FlowMoment_1.FlowMoment.countDocuments({ userId: new mongoose_1.default.Types.ObjectId(userId) })
        ]);
        return {
            totalConversations,
            totalPassionSparks,
            totalFlowMoments
        };
    }
}
exports.MentorService = MentorService;
exports.mentorService = new MentorService();
//# sourceMappingURL=mentor.service.js.map