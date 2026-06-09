"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const teacherObservationService_1 = __importDefault(require("./teacherObservationService"));
const personalizedExpressionService_1 = __importDefault(require("./personalizedExpressionService"));
const teacherMemoryService_1 = __importDefault(require("./teacherMemoryService"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 深度思考启程老师 - 统一服务
 * 整合观察、思考、记忆、表达四大能力
 */
class DeepThinkingTeacherService {
    /**
     * 场景1：任务开始时 - 把企业需求转化为学生能执行的第一步
     */
    async onTaskStart(studentId, taskId, taskDescription) {
        try {
            logger_1.default.info(`Deep thinking teacher: Task start for student ${studentId}`);
            // 记录观察
            await teacherObservationService_1.default.recordStudentBehavior({
                studentId,
                behaviorType: 'task_start',
                context: { taskId, taskDescription }
            });
            // 深度思考并生成回复
            const response = await personalizedExpressionService_1.default.generateResponse({
                studentId,
                situation: `学生刚刚接受了一个新任务：${taskDescription}`,
                question: '如何帮助学生开始这个任务？',
                taskId
            });
            return response.response;
        }
        catch (error) {
            logger_1.default.error('Failed in onTaskStart:', error);
            return '欢迎开始新任务！让我们一起来看看这个任务需要做什么。';
        }
    }
    /**
     * 场景2：学生卡住时 - 把学生的困难重新表述为可探索的方向
     */
    async onStudentStuck(studentId, taskId, studentMessage, timeElapsed) {
        try {
            logger_1.default.info(`Deep thinking teacher: Student stuck for student ${studentId}`);
            // 记录观察
            await teacherObservationService_1.default.recordStudentBehavior({
                studentId,
                behaviorType: 'seek_help',
                context: {
                    taskId,
                    studentMessage,
                    timeElapsed
                },
                emotionalState: {
                    confidence: 0.4, // 求助说明信心不足
                    frustration: timeElapsed > 7200 ? 0.7 : 0.5, // 超过2小时，挫折感更高
                    engagement: 0.8 // 主动求助说明投入度高
                }
            });
            // 深度思考并生成回复
            const response = await personalizedExpressionService_1.default.generateResponse({
                studentId,
                situation: `学生在任务进行${Math.floor(timeElapsed / 60)}分钟后求助，说："${studentMessage}"`,
                question: '学生真正卡在哪里？如何引导他自己找到方向？',
                taskId
            });
            return response.response;
        }
        catch (error) {
            logger_1.default.error('Failed in onStudentStuck:', error);
            return '我看到你遇到困难了。能具体说说你卡在哪一步吗？';
        }
    }
    /**
     * 场景3：交付物被打回时 - 把企业的模糊反馈转化为具体修改方向
     */
    async onWorkRejected(studentId, taskId, companyFeedback, attemptNumber) {
        try {
            logger_1.default.info(`Deep thinking teacher: Work rejected for student ${studentId}, attempt ${attemptNumber}`);
            // 记录学生行为
            await teacherObservationService_1.default.recordStudentBehavior({
                studentId,
                behaviorType: 'revise_work',
                context: {
                    taskId,
                    attemptNumber,
                    companyFeedback
                },
                emotionalState: {
                    confidence: Math.max(0.3, 0.8 - attemptNumber * 0.15), // 被打回越多，信心越低
                    frustration: Math.min(0.9, 0.3 + attemptNumber * 0.2), // 挫折感递增
                    engagement: 0.7
                }
            });
            // 记录企业反馈观察
            await teacherObservationService_1.default.recordCompanyFeedback({
                companyId: '', // 需要从任务获取
                studentId,
                taskId,
                feedbackType: 'request_revision',
                originalWords: companyFeedback,
                tone: attemptNumber >= 3 ? 'frustrated' : 'disappointed'
            });
            // 深度思考并生成回复
            const response = await personalizedExpressionService_1.default.generateResponse({
                studentId,
                situation: `这是学生第${attemptNumber}次修改。企业反馈："${companyFeedback}"`,
                question: '如何帮助学生理解企业的真实意图，并给出可操作的修改方向？',
                taskId
            });
            return response.response;
        }
        catch (error) {
            logger_1.default.error('Failed in onWorkRejected:', error);
            return '我看到这次又被打回了。让我们一起分析一下企业的反馈。';
        }
    }
    /**
     * 场景4：学生完成里程碑时 - 把学生的成长转化为企业能看懂的价值
     */
    async onMilestoneComplete(studentId, milestone, tasksCompleted) {
        try {
            logger_1.default.info(`Deep thinking teacher: Milestone complete for student ${studentId}`);
            // 记录观察
            await teacherObservationService_1.default.recordStudentBehavior({
                studentId,
                behaviorType: 'task_complete',
                context: {
                    milestone,
                    tasksCompleted
                },
                emotionalState: {
                    confidence: 0.8,
                    frustration: 0.2,
                    engagement: 0.9
                }
            });
            // 触发记忆巩固（异步）
            teacherMemoryService_1.default.consolidateMemory(studentId).catch(err => {
                logger_1.default.error('Failed to consolidate memory:', err);
            });
            // 生成鼓励
            const response = await personalizedExpressionService_1.default.quickResponse(studentId, `学生完成了${milestone}，已完成${tasksCompleted}个任务`, 'encouragement');
            return response;
        }
        catch (error) {
            logger_1.default.error('Failed in onMilestoneComplete:', error);
            return '恭喜你完成了这个里程碑！继续加油！';
        }
    }
    /**
     * 场景5：企业浏览学生时 - 把学生人格标签翻译为商业价值
     */
    async getStudentValueDescription(studentId) {
        try {
            logger_1.default.info(`Deep thinking teacher: Get value description for student ${studentId}`);
            // 获取长期记忆
            const memory = await teacherMemoryService_1.default.getLongTermMemory(studentId);
            if (!memory || !memory.deep_understanding) {
                return '这是一位新学生，正在建立能力画像。';
            }
            // 提取核心优势，转化为商业价值
            const strengths = memory.core_strengths || [];
            const workingStyle = memory.working_style || '';
            if (strengths.length === 0) {
                return memory.deep_understanding.substring(0, 100);
            }
            // 简单转化：优势 + 工作风格
            return `擅长${strengths[0]}，${workingStyle}。已完成${memory.observation_count || 0}次观察，理解信心${Math.floor((memory.confidence_level || 0) * 100)}%。`;
        }
        catch (error) {
            logger_1.default.error('Failed in getStudentValueDescription:', error);
            return '能力画像生成中...';
        }
    }
    /**
     * 主动洞察 - 定期检查学生状态，主动发现问题
     */
    async proactiveInsight(studentId) {
        try {
            // 获取最近的行为
            const recentBehaviors = await teacherObservationService_1.default.getRecentBehaviors(studentId, 10);
            if (recentBehaviors.length < 5) {
                return null; // 数据太少
            }
            // 检查异常模式
            const helpRequests = recentBehaviors.filter(b => b.behavior_type === 'seek_help');
            const helpRate = helpRequests.length / recentBehaviors.length;
            // 如果求助频率突然升高（超过50%）
            if (helpRate > 0.5) {
                logger_1.default.info(`Proactive insight: High help rate for student ${studentId}`);
                const response = await personalizedExpressionService_1.default.generateResponse({
                    studentId,
                    situation: `学生最近${recentBehaviors.length}次行为中，有${helpRequests.length}次求助，求助频率异常高`,
                    question: '学生是否遇到了系统性的困难？需要主动介入吗？'
                });
                return response.response;
            }
            return null; // 没有发现异常
        }
        catch (error) {
            logger_1.default.error('Failed in proactiveInsight:', error);
            return null;
        }
    }
    /**
     * 获取学生的深度理解（用于调试和展示）
     */
    async getStudentUnderstanding(studentId) {
        try {
            const memory = await teacherMemoryService_1.default.getLongTermMemory(studentId);
            const keyMoments = await teacherObservationService_1.default.getKeyMoments(studentId, 5);
            const recentBehaviors = await teacherObservationService_1.default.getRecentBehaviors(studentId, 10);
            return {
                longTermMemory: memory,
                keyMoments,
                recentBehaviors,
                observationCount: memory?.observation_count || 0,
                confidenceLevel: memory?.confidence_level || 0
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get student understanding:', error);
            return null;
        }
    }
}
exports.default = new DeepThinkingTeacherService();
//# sourceMappingURL=deepThinkingTeacherService.js.map