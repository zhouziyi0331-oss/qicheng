"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequirementSummary = exports.getTaskTranslation = void 0;
const qichengTeacherService_1 = __importDefault(require("../services/qichengTeacherService"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 启程老师控制器
 * 提供任务翻译API
 */
/**
 * 获取任务的启程老师翻译
 * GET /api/v1/tasks/:taskId/translation
 */
const getTaskTranslation = async (req, res) => {
    const { taskId } = req.params;
    try {
        logger_1.default.info(`Getting translation for task ${taskId}`);
        // 先查询缓存的翻译
        const translation = await qichengTeacherService_1.default.getTranslation(taskId);
        if (translation) {
            return res.json({
                success: true,
                translation: {
                    studentFriendlyTitle: translation.student_friendly_title,
                    studentFriendlyDescription: translation.student_friendly_description,
                    functionalModules: translation.functional_modules,
                    whatYouWillDo: translation.what_you_will_do,
                    whatYouWillLearn: translation.what_you_will_learn,
                    difficulty: translation.difficulty_breakdown,
                    estimatedHours: translation.estimated_hours,
                    translatedAt: translation.created_at
                }
            });
        }
        // 如果没有缓存，实时生成
        const result = await qichengTeacherService_1.default.analyzeAndTranslateTask(taskId);
        res.json({
            success: true,
            translation: {
                studentFriendlyTitle: result.student_friendly_title,
                studentFriendlyDescription: result.student_friendly_description,
                functionalModules: result.functional_modules,
                whatYouWillDo: result.what_you_will_do,
                whatYouWillLearn: result.what_you_will_learn,
                difficulty: result.difficulty,
                estimatedHours: result.estimated_hours
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get task translation failed:', error);
        res.status(500).json({
            error: '翻译失败',
            message: error.message
        });
    }
};
exports.getTaskTranslation = getTaskTranslation;
/**
 * 为任务生成需求摘要（用于向量生成）
 * POST /api/v1/tasks/:taskId/generate-summary
 */
const generateRequirementSummary = async (req, res) => {
    const { taskId } = req.params;
    try {
        logger_1.default.info(`Generating requirement summary for task ${taskId}`);
        const summary = await qichengTeacherService_1.default.generateProjectRequirementSummary(taskId);
        res.json({
            success: true,
            summary
        });
    }
    catch (error) {
        logger_1.default.error('Generate requirement summary failed:', error);
        res.status(500).json({
            error: '生成失败',
            message: error.message
        });
    }
};
exports.generateRequirementSummary = generateRequirementSummary;
//# sourceMappingURL=qichengTeacherController.js.map