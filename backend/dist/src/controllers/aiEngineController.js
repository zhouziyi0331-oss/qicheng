"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIQAController = exports.AITaskReviewController = exports.AITaskDecompositionController = exports.AIRequirementController = void 0;
const aiEngineService_1 = require("../services/aiEngineService");
/**
 * AI需求确认控制器
 */
class AIRequirementController {
    /**
     * 开始需求确认对话
     */
    static async startDialogue(req, res) {
        try {
            const companyId = req.user.userId;
            const { taskDraftId } = req.body;
            const result = await aiEngineService_1.AIRequirementEngine.startDialogue(companyId, taskDraftId);
            res.json({
                success: true,
                data: result,
                message: 'AI对话已开始'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 发送消息
     */
    static async sendMessage(req, res) {
        try {
            const companyId = req.user.userId;
            const { sessionId, message } = req.body;
            const response = await aiEngineService_1.AIRequirementEngine.processMessage(sessionId, companyId, message);
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取对话历史
     */
    static async getDialogueHistory(req, res) {
        try {
            const { sessionId } = req.params;
            const history = await aiEngineService_1.AIRequirementEngine.getDialogueHistory(sessionId);
            res.json({
                success: true,
                data: history
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AIRequirementController = AIRequirementController;
/**
 * AI任务拆解控制器
 */
class AITaskDecompositionController {
    /**
     * 拆解任务
     */
    static async decomposeTask(req, res) {
        try {
            const { taskId, taskDescription } = req.body;
            const decomposition = await aiEngineService_1.AITaskDecompositionEngine.decomposeTask(taskId, taskDescription);
            res.json({
                success: true,
                data: decomposition,
                message: '任务拆解完成'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 创建子任务
     */
    static async createSubtasks(req, res) {
        try {
            const { decompositionId, parentTaskId } = req.body;
            await aiEngineService_1.AITaskDecompositionEngine.createSubtasks(decompositionId, parentTaskId);
            res.json({
                success: true,
                message: '子任务已创建'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取子任务列表
     */
    static async getSubtasks(req, res) {
        try {
            const { taskId } = req.params;
            const subtasks = await aiEngineService_1.AITaskDecompositionEngine.getSubtasks(parseInt(taskId));
            res.json({
                success: true,
                data: subtasks
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AITaskDecompositionController = AITaskDecompositionController;
/**
 * AI任务审核控制器
 */
class AITaskReviewController {
    /**
     * AI审核任务
     */
    static async reviewTask(req, res) {
        try {
            const { taskId, taskData } = req.body;
            const review = await aiEngineService_1.AITaskReviewEngine.reviewTask(taskId, taskData);
            res.json({
                success: true,
                data: review,
                message: 'AI审核完成'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 人工审核
     */
    static async humanReview(req, res) {
        try {
            const reviewerId = req.user.userId;
            const { reviewId } = req.params;
            const { approved, feedback } = req.body;
            await aiEngineService_1.AITaskReviewEngine.humanReview(parseInt(reviewId), parseInt(reviewerId), approved, feedback);
            res.json({
                success: true,
                message: '人工审核完成'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AITaskReviewController = AITaskReviewController;
/**
 * AI问答控制器
 */
class AIQAController {
    /**
     * 提问
     */
    static async askQuestion(req, res) {
        try {
            const userId = req.user.userId;
            const { question, taskId } = req.body;
            const answer = await aiEngineService_1.AIQAEngine.answerQuestion(userId, question, taskId);
            res.json({
                success: true,
                data: answer
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 标记答案是否有帮助
     */
    static async markHelpful(req, res) {
        try {
            const { historyId } = req.params;
            const { isHelpful } = req.body;
            await aiEngineService_1.AIQAEngine.markHelpful(parseInt(historyId), isHelpful);
            res.json({
                success: true,
                message: '反馈已记录'
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AIQAController = AIQAController;
//# sourceMappingURL=aiEngineController.js.map