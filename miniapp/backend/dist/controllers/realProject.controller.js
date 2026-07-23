"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectDetail = exports.getProjectStats = exports.getMyProjects = exports.completeProject = exports.acceptProject = exports.applyForProject = exports.getAvailableProjects = void 0;
const realProject_service_1 = require("../services/realProject.service");
const logger_1 = require("../utils/logger");
/**
 * 真实项目控制器
 */
/**
 * GET /api/real-projects/available
 * 获取可接单的项目列表
 */
const getAvailableProjects = async (req, res) => {
    try {
        const { category, difficulty, minBudget, maxBudget, requiredAbilities } = req.query;
        const filters = {};
        if (category)
            filters.category = category;
        if (difficulty)
            filters.difficulty = difficulty;
        if (minBudget)
            filters.minBudget = parseFloat(minBudget);
        if (maxBudget)
            filters.maxBudget = parseFloat(maxBudget);
        if (requiredAbilities) {
            filters.requiredAbilities = requiredAbilities.split(',');
        }
        const projects = await realProject_service_1.realProjectService.getAvailableProjects(filters);
        res.json({
            success: true,
            data: {
                total: projects.length,
                projects
            }
        });
    }
    catch (error) {
        logger_1.log.error('获取可用项目失败', { error: error.message });
        res.status(500).json({ error: '获取可用项目失败' });
    }
};
exports.getAvailableProjects = getAvailableProjects;
/**
 * POST /api/real-projects/:id/apply
 * 申请项目
 */
const applyForProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const project = await realProject_service_1.realProjectService.applyForProject(userId, id);
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        logger_1.log.error('申请项目失败', { error: error.message });
        res.status(400).json({ error: error.message || '申请项目失败' });
    }
};
exports.applyForProject = applyForProject;
/**
 * POST /api/real-projects/:id/accept
 * 接受项目（开始工作）
 */
const acceptProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const project = await realProject_service_1.realProjectService.acceptProject(userId, id);
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        logger_1.log.error('接受项目失败', { error: error.message });
        res.status(400).json({ error: error.message || '接受项目失败' });
    }
};
exports.acceptProject = acceptProject;
/**
 * POST /api/real-projects/:id/complete
 * 完成项目
 */
const completeProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { deliverables } = req.body;
        if (!deliverables || !Array.isArray(deliverables)) {
            return res.status(400).json({ error: '请提供交付物' });
        }
        const project = await realProject_service_1.realProjectService.completeProject(userId, id, deliverables);
        res.json({
            success: true,
            data: project,
            message: '项目已完成，收入已到账'
        });
    }
    catch (error) {
        logger_1.log.error('完成项目失败', { error: error.message });
        res.status(400).json({ error: error.message || '完成项目失败' });
    }
};
exports.completeProject = completeProject;
/**
 * GET /api/real-projects/my-projects
 * 获取用户的项目列表
 */
const getMyProjects = async (req, res) => {
    try {
        const userId = req.userId;
        const { status } = req.query;
        const projects = await realProject_service_1.realProjectService.getUserProjects(userId, status);
        res.json({
            success: true,
            data: {
                total: projects.length,
                projects
            }
        });
    }
    catch (error) {
        logger_1.log.error('获取我的项目失败', { error: error.message });
        res.status(500).json({ error: '获取我的项目失败' });
    }
};
exports.getMyProjects = getMyProjects;
/**
 * GET /api/real-projects/stats
 * 获取项目统计
 */
const getProjectStats = async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await realProject_service_1.realProjectService.getUserProjectStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.log.error('获取项目统计失败', { error: error.message });
        res.status(500).json({ error: '获取项目统计失败' });
    }
};
exports.getProjectStats = getProjectStats;
/**
 * GET /api/real-projects/:id
 * 获取项目详情
 */
const getProjectDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await realProject_service_1.realProjectService.getProjectDetail(id);
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        logger_1.log.error('获取项目详情失败', { error: error.message });
        res.status(404).json({ error: error.message || '获取项目详情失败' });
    }
};
exports.getProjectDetail = getProjectDetail;
//# sourceMappingURL=realProject.controller.js.map