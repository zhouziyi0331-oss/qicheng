"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionPreCheckService = exports.SubmissionPreCheckService = void 0;
const aiServiceClient_1 = require("./aiServiceClient");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 交付物预检服务
 * 在学生提交前提供AI预检，降低被打回率
 */
class SubmissionPreCheckService {
    /**
     * 预检学生提交内容
     *
     * @param taskId 任务ID
     * @param studentId 学生ID
     * @param submissionContent 提交内容描述
     * @returns 预检结果
     */
    async preCheckSubmission(taskId, studentId, submissionContent) {
        try {
            logger_1.default.info('Starting pre-check for submission', { taskId, studentId });
            // 调用Python AI服务的预检API
            const result = await aiServiceClient_1.aiServiceClient.preCheckSubmission({
                task_id: taskId,
                student_id: studentId,
                submission_description: submissionContent,
                attachments: [],
            });
            // 分类问题
            const criticalIssues = result.issues
                .filter((issue) => issue.severity === 'critical')
                .map((issue) => ({
                description: issue.description,
                suggestion: issue.suggestion,
            }));
            const warnings = result.issues
                .filter((issue) => issue.severity === 'warning')
                .map((issue) => ({
                description: issue.description,
                suggestion: issue.suggestion,
            }));
            // 判断是否建议提交
            // 通过概率 >= 70% 且没有critical问题时建议提交
            const shouldSubmit = result.pass_probability >= 70 && criticalIssues.length === 0;
            logger_1.default.info('Pre-check completed', {
                taskId,
                studentId,
                passLikelihood: result.pass_probability,
                shouldSubmit,
                criticalCount: criticalIssues.length,
                warningCount: warnings.length,
            });
            return {
                passLikelihood: result.pass_probability,
                criticalIssues,
                warnings,
                highlights: result.highlights,
                overallFeedback: result.overall_feedback,
                shouldSubmit,
            };
        }
        catch (error) {
            logger_1.default.error('Pre-check service error', {
                taskId,
                studentId,
                error: error instanceof Error ? error.message : String(error),
            });
            // 降级：返回中性结果，不阻止提交
            return {
                passLikelihood: 75,
                criticalIssues: [],
                warnings: [],
                highlights: [],
                overallFeedback: 'AI预检服务暂时不可用，你可以直接提交。',
                shouldSubmit: true,
            };
        }
    }
    /**
     * 格式化预检结果为用户友好的文本
     */
    formatPreCheckResult(result) {
        let message = `## 📊 通过概率：${result.passLikelihood}%\n\n`;
        if (result.criticalIssues.length > 0) {
            message += `### ⚠️ 关键问题（必须修改）\n`;
            result.criticalIssues.forEach((issue, index) => {
                message += `${index + 1}. **${issue.description}**\n`;
                message += `   💡 建议：${issue.suggestion}\n\n`;
            });
        }
        if (result.warnings.length > 0) {
            message += `### ⚡ 改进建议\n`;
            result.warnings.forEach((warning, index) => {
                message += `${index + 1}. ${warning.description}\n`;
                message += `   💡 ${warning.suggestion}\n\n`;
            });
        }
        if (result.highlights.length > 0) {
            message += `### ✨ 亮点\n`;
            result.highlights.forEach((highlight, index) => {
                message += `${index + 1}. ${highlight}\n`;
            });
            message += '\n';
        }
        message += `### 💬 总体评价\n${result.overallFeedback}\n\n`;
        if (result.shouldSubmit) {
            message += `✅ **建议提交**：你的交付物质量不错，可以提交了！`;
        }
        else {
            message += `⏸️ **建议修改后再提交**：先解决上述关键问题，提高通过率。`;
        }
        return message;
    }
}
exports.SubmissionPreCheckService = SubmissionPreCheckService;
// 导出单例
exports.submissionPreCheckService = new SubmissionPreCheckService();
//# sourceMappingURL=submissionPreCheckService.js.map