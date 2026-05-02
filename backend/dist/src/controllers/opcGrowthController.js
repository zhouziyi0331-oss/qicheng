"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPCGrowthController = void 0;
const opcGrowthService_1 = require("../services/opcGrowthService");
class OPCGrowthController {
    static async startAssessment(req, res) {
        try {
            const studentId = req.user.userId;
            const { assessmentType } = req.body;
            const result = await opcGrowthService_1.OPCAssessmentService.startAssessment(studentId, assessmentType);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async submitAnswer(req, res) {
        try {
            const { assessmentId, questionId, answer } = req.body;
            await opcGrowthService_1.OPCAssessmentService.submitAnswer(assessmentId, questionId, answer);
            res.json({ success: true, message: '答案已提交' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async completeAssessment(req, res) {
        try {
            const { assessmentId } = req.params;
            const result = await opcGrowthService_1.OPCAssessmentService.completeAssessment(parseInt(assessmentId));
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getAssessmentResult(req, res) {
        try {
            const { assessmentId } = req.params;
            const result = await opcGrowthService_1.OPCAssessmentService.getAssessmentResult(parseInt(assessmentId));
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async generateGrowthReport(req, res) {
        try {
            const studentId = req.user.userId;
            const { reportPeriod, periodStart, periodEnd } = req.body;
            const result = await opcGrowthService_1.GrowthReportService.generateReport(studentId, reportPeriod, new Date(periodStart), new Date(periodEnd));
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async createAbilitySnapshot(req, res) {
        try {
            const studentId = req.user.userId;
            await opcGrowthService_1.GrowthReportService.createAbilitySnapshot(studentId);
            res.json({ success: true, message: '快照已创建' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.OPCGrowthController = OPCGrowthController;
//# sourceMappingURL=opcGrowthController.js.map