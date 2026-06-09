"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submissionPreCheckService_1 = require("../services/submissionPreCheckService");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/submissions/pre-check
 * 预检学生提交内容
 *
 * Body:
 * {
 *   taskId: string,
 *   submissionContent: string
 * }
 */
router.post('/pre-check', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId, submissionContent } = req.body;
        const studentId = req.user?.userId;
        // 验证必填字段
        if (!taskId || !submissionContent) {
            return res.status(400).json({
                error: 'taskId and submissionContent are required',
            });
        }
        if (!studentId) {
            return res.status(401).json({
                error: 'User not authenticated',
            });
        }
        // 验证提交内容长度
        if (submissionContent.length < 10) {
            return res.status(400).json({
                error: 'Submission content too short (minimum 10 characters)',
            });
        }
        if (submissionContent.length > 10000) {
            return res.status(400).json({
                error: 'Submission content too long (maximum 10000 characters)',
            });
        }
        logger_1.default.info('Pre-check request received', {
            taskId,
            studentId,
            contentLength: submissionContent.length,
        });
        // 执行预检
        const result = await submissionPreCheckService_1.submissionPreCheckService.preCheckSubmission(taskId, studentId, submissionContent);
        // 返回结果
        res.json({
            success: true,
            data: {
                passLikelihood: result.passLikelihood,
                criticalIssues: result.criticalIssues,
                warnings: result.warnings,
                highlights: result.highlights,
                overallFeedback: result.overallFeedback,
                shouldSubmit: result.shouldSubmit,
                formattedMessage: submissionPreCheckService_1.submissionPreCheckService.formatPreCheckResult(result),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Pre-check endpoint error', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
            error: 'Failed to perform pre-check',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=submissionPreCheck.js.map