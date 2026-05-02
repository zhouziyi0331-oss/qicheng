"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPCV2AssessmentController = void 0;
const opcV2AssessmentService_1 = require("../services/opcV2AssessmentService");
/**
 * OPC能力画像测试控制器 v2.0
 */
class OPCV2AssessmentController {
    /**
     * 开始测试
     */
    static async startAssessment(req, res) {
        try {
            const studentId = req.user.userId;
            const result = await opcV2AssessmentService_1.OPCV2AssessmentService.startAssessment(studentId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 提交答案
     */
    static async submitAnswer(req, res) {
        try {
            const { assessmentId, questionId, answer } = req.body;
            await opcV2AssessmentService_1.OPCV2AssessmentService.submitAnswer(assessmentId, questionId, answer);
            res.json({ success: true, message: '答案已提交' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 完成测试
     */
    static async completeAssessment(req, res) {
        try {
            const { assessmentId } = req.params;
            const result = await opcV2AssessmentService_1.OPCV2AssessmentService.completeAssessment(assessmentId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取测试进度
     */
    static async getProgress(req, res) {
        try {
            const { assessmentId } = req.params;
            const result = await opcV2AssessmentService_1.OPCV2AssessmentService.getAssessmentProgress(assessmentId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取测试结果
     */
    static async getAssessmentResult(req, res) {
        try {
            const { assessmentId } = req.params;
            const result = await opcV2AssessmentService_1.OPCV2AssessmentService.getAssessmentResult(assessmentId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * 获取最新测试结果
     */
    static async getLatestResult(req, res) {
        try {
            const studentId = req.user.userId;
            const result = await opcV2AssessmentService_1.OPCV2AssessmentService.getLatestResult(studentId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.OPCV2AssessmentController = OPCV2AssessmentController;
//# sourceMappingURL=opcV2AssessmentController.js.map