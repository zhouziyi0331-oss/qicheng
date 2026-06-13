"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedMentorController = void 0;
const enhancedMentorService_1 = __importDefault(require("../services/enhancedMentorService"));
const pblAgentService_1 = require("../services/pblAgentService");
const codeExecutionService_1 = __importDefault(require("../services/codeExecutionService"));
const fileProcessingService_1 = __importDefault(require("../services/fileProcessingService"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 增强版导师控制器
 * 统一的API入口，整合情感陪伴和项目实战功能
 */
class EnhancedMentorController {
    /**
     * 统一对话接口
     * POST /api/v1/mentor/chat
     */
    async chat(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { message, sessionId, taskId, projectId, forceMode } = req.body;
            if (!message) {
                res.status(400).json({ error: 'Message is required' });
                return;
            }
            const result = await enhancedMentorService_1.default.chat(userId, message, {
                sessionId,
                taskId,
                projectId,
                forceMode
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Chat error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process chat'
            });
        }
    }
    /**
     * 初始化新项目
     * POST /api/v1/mentor/projects/init
     */
    async initProject(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { initialProblem, title, domain, learningGoals } = req.body;
            if (!initialProblem) {
                res.status(400).json({ error: 'Initial problem is required' });
                return;
            }
            const result = await pblAgentService_1.pblAgentService.initializeProject(userId, initialProblem, { title, domain, learningGoals });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Project initialization error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initialize project'
            });
        }
    }
    /**
     * 获取用户的项目列表
     * GET /api/v1/mentor/projects
     */
    async getProjects(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { status } = req.query;
            // TODO: 实现获取项目列表的逻辑
            res.json({
                success: true,
                data: {
                    projects: []
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get projects error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get projects'
            });
        }
    }
    /**
     * 获取项目详情
     * GET /api/v1/mentor/projects/:projectId
     */
    async getProjectDetail(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            // TODO: 实现获取项目详情的逻辑
            res.json({
                success: true,
                data: {
                    project: {}
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get project detail error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get project detail'
            });
        }
    }
    /**
     * 任务拆解引导
     * POST /api/v1/mentor/projects/:projectId/decompose
     */
    async guideDecomposition(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const { taskDescription } = req.body;
            if (!taskDescription) {
                res.status(400).json({ error: 'Task description is required' });
                return;
            }
            const result = await pblAgentService_1.pblAgentService.guideTaskDecomposition(projectId, taskDescription);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Task decomposition error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to guide task decomposition'
            });
        }
    }
    /**
     * 评估任务拆解
     * POST /api/v1/mentor/projects/:projectId/evaluate-decomposition
     */
    async evaluateDecomposition(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const { tasks } = req.body;
            if (!tasks || !Array.isArray(tasks)) {
                res.status(400).json({ error: 'Tasks array is required' });
                return;
            }
            const result = await pblAgentService_1.pblAgentService.evaluateDecomposition(projectId, tasks);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Evaluate decomposition error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to evaluate decomposition'
            });
        }
    }
    /**
     * 执行代码
     * POST /api/v1/mentor/projects/:projectId/execute-code
     */
    async executeCode(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const { language, code, timeout } = req.body;
            if (!language || !code) {
                res.status(400).json({ error: 'Language and code are required' });
                return;
            }
            const result = await codeExecutionService_1.default.executeCode(projectId, language, code, { timeout });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Code execution error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to execute code'
            });
        }
    }
    /**
     * 获取代码执行历史
     * GET /api/v1/mentor/projects/:projectId/execution-history
     */
    async getExecutionHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const history = await codeExecutionService_1.default.getExecutionHistory(projectId, limit);
            res.json({
                success: true,
                data: { history }
            });
        }
        catch (error) {
            logger_1.default.error('Get execution history error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get execution history'
            });
        }
    }
    /**
     * 上传文件
     * POST /api/v1/mentor/projects/:projectId/upload
     */
    async uploadFile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const file = req.file;
            if (!file) {
                res.status(400).json({ error: 'File is required' });
                return;
            }
            const result = await fileProcessingService_1.default.uploadFile(projectId, {
                filename: file.originalname,
                content: file.buffer,
                mimetype: file.mimetype
            }, {
                purpose: req.body.purpose,
                aiAnalyze: req.body.aiAnalyze !== 'false'
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('File upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload file'
            });
        }
    }
    /**
     * 获取项目文件列表
     * GET /api/v1/mentor/projects/:projectId/files
     */
    async getProjectFiles(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const { fileType } = req.query;
            const files = await fileProcessingService_1.default.getProjectFiles(projectId, fileType);
            res.json({
                success: true,
                data: { files }
            });
        }
        catch (error) {
            logger_1.default.error('Get project files error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get project files'
            });
        }
    }
    /**
     * 删除文件
     * DELETE /api/v1/mentor/files/:fileId
     */
    async deleteFile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { fileId } = req.params;
            const success = await fileProcessingService_1.default.deleteFile(fileId);
            res.json({
                success,
                message: success ? 'File deleted' : 'File not found'
            });
        }
        catch (error) {
            logger_1.default.error('Delete file error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete file'
            });
        }
    }
    /**
     * 引导反思
     * POST /api/v1/mentor/projects/:projectId/reflect
     */
    async guideReflection(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const { reflectionType } = req.body;
            if (!reflectionType) {
                res.status(400).json({ error: 'Reflection type is required' });
                return;
            }
            const result = await pblAgentService_1.pblAgentService.guideReflection(projectId, reflectionType);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.default.error('Guide reflection error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to guide reflection'
            });
        }
    }
    /**
     * 保存反思日志
     * POST /api/v1/mentor/projects/:projectId/reflection-log
     */
    async saveReflectionLog(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { projectId } = req.params;
            const { reflectionType, whatLearned, whatWorked, whatDidntWork, whatSurprised, nextSteps, emotionalState } = req.body;
            if (!reflectionType) {
                res.status(400).json({ error: 'Reflection type is required' });
                return;
            }
            const logId = await pblAgentService_1.pblAgentService.saveReflectionLog(projectId, reflectionType, {
                whatLearned,
                whatWorked,
                whatDidntWork,
                whatSurprised,
                nextSteps,
                emotionalState
            });
            res.json({
                success: true,
                data: { logId }
            });
        }
        catch (error) {
            logger_1.default.error('Save reflection log error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save reflection log'
            });
        }
    }
    /**
     * 切换导师模式
     * POST /api/v1/mentor/switch-mode
     */
    async switchMode(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { mode } = req.body;
            if (!['emotional', 'project', 'auto'].includes(mode)) {
                res.status(400).json({ error: 'Invalid mode' });
                return;
            }
            // TODO: 实现切换模式的逻辑
            res.json({
                success: true,
                message: `Switched to ${mode} mode`
            });
        }
        catch (error) {
            logger_1.default.error('Switch mode error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to switch mode'
            });
        }
    }
    /**
     * 获取导师使用统计
     * GET /api/v1/mentor/stats
     */
    async getStats(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            // TODO: 实现获取统计的逻辑
            res.json({
                success: true,
                data: {
                    emotionalSessions: 0,
                    projectSessions: 0,
                    hybridSessions: 0,
                    totalProjects: 0,
                    completedProjects: 0
                }
            });
        }
        catch (error) {
            logger_1.default.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get stats'
            });
        }
    }
}
exports.EnhancedMentorController = EnhancedMentorController;
exports.default = new EnhancedMentorController();
//# sourceMappingURL=enhancedMentorController.js.map