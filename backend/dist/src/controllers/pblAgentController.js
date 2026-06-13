"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pblAgentController = exports.PBLAgentController = void 0;
const pblAgentService_1 = require("../services/pblAgentService");
class PBLAgentController {
    // 初始化项目
    async initializeProject(req, res) {
        try {
            const { initial_problem } = req.body;
            const userId = req.user.id;
            const result = await pblAgentService_1.pblAgentService.initializeProject(userId, initial_problem);
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            logger.error('初始化项目失败:', err);
            res.status(500).json({
                success: false,
                error: '初始化项目失败'
            });
        }
    }
    // 苏格拉底式对话
    async chat(req, res) {
        try {
            const { project_id, message, context } = req.body;
            const response = await pblAgentService_1.pblAgentService.conductSocraticDialogue(project_id, message, context);
            res.json({
                success: true,
                data: response
            });
        }
        catch (err) {
            logger.error('对话失败:', err);
            res.status(500).json({
                success: false,
                error: '对话失败'
            });
        }
    }
    // 任务拆解引导
    async guideTaskDecomposition(req, res) {
        try {
            const { project_id, task_title } = req.body;
            const result = await pblAgentService_1.pblAgentService.guideTaskDecomposition(project_id, task_title);
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            logger.error('任务拆解引导失败:', err);
            res.status(500).json({
                success: false,
                error: '任务拆解引导失败'
            });
        }
    }
    // 评估任务拆解
    async evaluateDecomposition(req, res) {
        try {
            const { task_id, subtasks } = req.body;
            const evaluation = await pblAgentService_1.pblAgentService.evaluateDecomposition(task_id, subtasks);
            res.json({
                success: true,
                data: evaluation
            });
        }
        catch (err) {
            logger.error('评估拆解失败:', err);
            res.status(500).json({
                success: false,
                error: '评估拆解失败'
            });
        }
    }
    // 建议MVP方案
    async suggestMVP(req, res) {
        try {
            const { task_id, user_context } = req.body;
            const mvp = await pblAgentService_1.pblAgentService.suggestMVPSolution(task_id, user_context);
            res.json({
                success: true,
                data: mvp
            });
        }
        catch (err) {
            logger.error('生成MVP方案失败:', err);
            res.status(500).json({
                success: false,
                error: '生成MVP方案失败'
            });
        }
    }
    // 执行代码
    async executeCode(req, res) {
        try {
            const { project_id, task_id, language, code } = req.body;
            const result = await pblAgentService_1.pblAgentService.executeCode(project_id, language, code, task_id);
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            logger.error('代码执行失败:', err);
            res.status(500).json({
                success: false,
                error: '代码执行失败'
            });
        }
    }
    // 引导反思
    async guideReflection(req, res) {
        try {
            const { project_id, reflection_type } = req.body;
            const questions = await pblAgentService_1.pblAgentService.guideReflection(project_id, reflection_type);
            res.json({
                success: true,
                data: { questions }
            });
        }
        catch (err) {
            logger.error('生成反思问题失败:', err);
            res.status(500).json({
                success: false,
                error: '生成反思问题失败'
            });
        }
    }
    // 保存反思日志
    async saveReflection(req, res) {
        try {
            const { project_id, phase_id, reflection } = req.body;
            const log = await pblAgentService_1.pblAgentService.saveReflectionLog(project_id, phase_id, reflection);
            res.json({
                success: true,
                data: log
            });
        }
        catch (err) {
            logger.error('保存反思日志失败:', err);
            res.status(500).json({
                success: false,
                error: '保存反思日志失败'
            });
        }
    }
}
exports.PBLAgentController = PBLAgentController;
exports.pblAgentController = new PBLAgentController();
//# sourceMappingURL=pblAgentController.js.map