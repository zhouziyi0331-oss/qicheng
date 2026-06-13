"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectService_1 = __importDefault(require("../../services/projectService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/projects
 * 创建项目
 */
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以创建项目',
            });
        }
        const { name, description, totalBudget, estimatedDurationDays, estimatedEndDate, category, tags, } = req.body;
        if (!name || !description || !totalBudget) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: name, description, totalBudget',
            });
        }
        const project = await projectService_1.default.createProject({
            companyId,
            name,
            description,
            totalBudget,
            estimatedDurationDays,
            estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : undefined,
            category,
            tags,
        });
        res.json({
            success: true,
            data: project,
            message: '项目创建成功',
        });
    }
    catch (error) {
        console.error('创建项目失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建项目失败',
        });
    }
});
/**
 * GET /api/projects
 * 获取企业的项目列表
 */
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以查看项目',
            });
        }
        const { status, limit, offset } = req.query;
        const result = await projectService_1.default.getCompanyProjects(companyId, {
            status: status,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('获取项目列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取项目列表失败',
        });
    }
});
/**
 * GET /api/projects/:id
 * 获取项目详情
 */
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以查看项目',
            });
        }
        const project = await projectService_1.default.getProject(projectId, companyId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: '项目不存在',
            });
        }
        res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error('获取项目详情失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取项目详情失败',
        });
    }
});
/**
 * PUT /api/projects/:id
 * 更新项目
 */
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以更新项目',
            });
        }
        const updates = req.body;
        const project = await projectService_1.default.updateProject(projectId, companyId, updates);
        res.json({
            success: true,
            data: project,
            message: '项目更新成功',
        });
    }
    catch (error) {
        console.error('更新项目失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新项目失败',
        });
    }
});
/**
 * POST /api/projects/:id/milestones
 * 添加里程碑
 */
router.post('/:id/milestones', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以添加里程碑',
            });
        }
        const { milestoneOrder, title, description, budgetAllocation, estimatedDurationDays, dueDate, deliverables, acceptanceCriteria, dependsOnMilestoneId, } = req.body;
        if (!milestoneOrder || !title || !budgetAllocation) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: milestoneOrder, title, budgetAllocation',
            });
        }
        const milestone = await projectService_1.default.addMilestone({
            projectId,
            companyId,
            milestoneOrder,
            title,
            description,
            budgetAllocation,
            estimatedDurationDays,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            deliverables,
            acceptanceCriteria,
            dependsOnMilestoneId,
        });
        res.json({
            success: true,
            data: milestone,
            message: '里程碑添加成功',
        });
    }
    catch (error) {
        console.error('添加里程碑失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '添加里程碑失败',
        });
    }
});
/**
 * GET /api/projects/:id/milestones
 * 获取项目的里程碑列表
 */
router.get('/:id/milestones', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以查看里程碑',
            });
        }
        const milestones = await projectService_1.default.getProjectMilestones(projectId, companyId);
        res.json({
            success: true,
            data: {
                milestones,
                total: milestones.length,
            },
        });
    }
    catch (error) {
        console.error('获取里程碑失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取里程碑失败',
        });
    }
});
/**
 * PUT /api/projects/milestones/:milestoneId
 * 更新里程碑
 */
router.put('/milestones/:milestoneId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以更新里程碑',
            });
        }
        const updates = req.body;
        const milestone = await projectService_1.default.updateMilestone(milestoneId, companyId, updates);
        res.json({
            success: true,
            data: milestone,
            message: '里程碑更新成功',
        });
    }
    catch (error) {
        console.error('更新里程碑失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新里程碑失败',
        });
    }
});
/**
 * POST /api/projects/:id/tasks
 * 关联任务到项目
 */
router.post('/:id/tasks', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以关联任务',
            });
        }
        const { taskId, milestoneId, taskOrder, isCritical } = req.body;
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: taskId',
            });
        }
        const link = await projectService_1.default.linkTaskToProject(projectId, milestoneId || null, taskId, companyId, { taskOrder, isCritical });
        res.json({
            success: true,
            data: link,
            message: '任务关联成功',
        });
    }
    catch (error) {
        console.error('关联任务失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '关联任务失败',
        });
    }
});
/**
 * GET /api/projects/:id/tasks
 * 获取项目的任务列表
 */
router.get('/:id/tasks', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以查看任务',
            });
        }
        const tasks = await projectService_1.default.getProjectTasks(projectId, companyId);
        res.json({
            success: true,
            data: {
                tasks,
                total: tasks.length,
            },
        });
    }
    catch (error) {
        console.error('获取任务列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取任务列表失败',
        });
    }
});
/**
 * POST /api/projects/:id/collaborators
 * 添加协作者到项目
 */
router.post('/:id/collaborators', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以添加协作者',
            });
        }
        const { studentId, role, responsibilities } = req.body;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: studentId',
            });
        }
        const collaborator = await projectService_1.default.addCollaborator(projectId, studentId, companyId, { role, responsibilities });
        res.json({
            success: true,
            data: collaborator,
            message: '协作者添加成功',
        });
    }
    catch (error) {
        console.error('添加协作者失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '添加协作者失败',
        });
    }
});
/**
 * GET /api/projects/:id/collaborators
 * 获取项目协作者
 */
router.get('/:id/collaborators', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以查看协作者',
            });
        }
        const collaborators = await projectService_1.default.getProjectCollaborators(projectId, companyId);
        res.json({
            success: true,
            data: {
                collaborators,
                total: collaborators.length,
            },
        });
    }
    catch (error) {
        console.error('获取协作者失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取协作者失败',
        });
    }
});
/**
 * POST /api/projects/:id/publish
 * 发布项目
 */
router.post('/:id/publish', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以发布项目',
            });
        }
        const project = await projectService_1.default.publishProject(projectId, companyId);
        res.json({
            success: true,
            data: project,
            message: '项目发布成功',
        });
    }
    catch (error) {
        console.error('发布项目失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '发布项目失败',
        });
    }
});
/**
 * GET /api/projects/:id/progress
 * 计算项目进度
 */
router.get('/:id/progress', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const progress = await projectService_1.default.calculateProjectProgress(projectId);
        res.json({
            success: true,
            data: {
                progress_percentage: progress,
            },
        });
    }
    catch (error) {
        console.error('计算项目进度失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '计算进度失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map