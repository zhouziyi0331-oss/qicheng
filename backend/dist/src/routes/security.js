"use strict";
/**
 * 安全相关路由
 *
 * 功能：
 * 1. 获取安全承诺列表
 * 2. 获取合作进度
 * 3. 获取访问日志
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../../utils/logger"));
const encryptionService_1 = __importDefault(require("../services/encryptionService"));
const dataAccessLogService_1 = __importDefault(require("../services/dataAccessLogService"));
const collaborationProgressService_1 = __importDefault(require("../services/collaborationProgressService"));
const contactUnlockService_1 = __importDefault(require("../services/contactUnlockService"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * 获取安全承诺列表
 * GET /api/security/commitments
 */
router.get('/commitments', async (req, res) => {
    try {
        const pool = require('../utils/db').default;
        const result = await pool.query(`SELECT id, title, content, category, display_order
       FROM security_commitments
       WHERE is_active = true
       ORDER BY display_order ASC, created_at ASC`);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get security commitments:', error);
        res.status(500).json({
            success: false,
            message: '获取安全承诺失败',
        });
    }
});
/**
 * 获取合作进度
 * GET /api/security/collaboration-progress/:studentId/:companyId
 */
router.get('/collaboration-progress/:studentId/:companyId', auth_1.authenticate, async (req, res) => {
    try {
        const { studentId, companyId } = req.params;
        const user = req.user;
        // 权限检查：只能查看自己相关的合作进度
        if (user.role === 'student' && user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权查看此合作进度',
            });
        }
        if (user.role === 'company' && user.id !== companyId) {
            return res.status(403).json({
                success: false,
                message: '无权查看此合作进度',
            });
        }
        const progress = await collaborationProgressService_1.default.getProgress(studentId, companyId);
        const hint = collaborationProgressService_1.default.getProgressHint(progress, user.role);
        const percentage = collaborationProgressService_1.default.getProgressPercentage(progress.completedCount);
        const status = collaborationProgressService_1.default.getProgressStatus(progress);
        res.json({
            success: true,
            data: {
                ...progress,
                hint,
                percentage,
                status,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get collaboration progress:', error);
        res.status(500).json({
            success: false,
            message: '获取合作进度失败',
        });
    }
});
/**
 * 获取用户的所有合作进度
 * GET /api/security/my-collaborations
 */
router.get('/my-collaborations', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        let collaborations;
        if (user.role === 'student') {
            collaborations = await collaborationProgressService_1.default.getStudentCollaborations(user.id);
        }
        else if (user.role === 'company') {
            collaborations = await collaborationProgressService_1.default.getCompanyCollaborations(user.id);
        }
        else {
            return res.status(403).json({
                success: false,
                message: '无权访问',
            });
        }
        // 为每个合作添加提示文案
        const enrichedCollaborations = collaborations.map((collab) => ({
            ...collab,
            hint: collaborationProgressService_1.default.getProgressHint(collab, user.role),
            percentage: collaborationProgressService_1.default.getProgressPercentage(collab.completedCount),
            status: collaborationProgressService_1.default.getProgressStatus(collab),
        }));
        res.json({
            success: true,
            data: enrichedCollaborations,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get collaborations:', error);
        res.status(500).json({
            success: false,
            message: '获取合作列表失败',
        });
    }
});
/**
 * 获取资源访问日志
 * GET /api/security/access-logs/:resourceType/:resourceId
 */
router.get('/access-logs/:resourceType/:resourceId', auth_1.authenticate, async (req, res) => {
    try {
        const { resourceType, resourceId } = req.params;
        const user = req.user;
        const limit = parseInt(req.query.limit) || 50;
        // 权限检查：只有管理员或资源所有者可以查看访问日志
        if (user.role !== 'admin' && user.role !== 'platform_admin') {
            // TODO: 检查用户是否是资源所有者
            return res.status(403).json({
                success: false,
                message: '无权查看访问日志',
            });
        }
        const logs = await dataAccessLogService_1.default.getAccessHistory(resourceType, resourceId, limit);
        res.json({
            success: true,
            data: logs,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get access logs:', error);
        res.status(500).json({
            success: false,
            message: '获取访问日志失败',
        });
    }
});
/**
 * 获取用户访问历史
 * GET /api/security/my-access-logs
 */
router.get('/my-access-logs', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const limit = parseInt(req.query.limit) || 50;
        const logs = await dataAccessLogService_1.default.getUserAccessHistory(user.id, limit);
        res.json({
            success: true,
            data: logs,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get user access logs:', error);
        res.status(500).json({
            success: false,
            message: '获取访问历史失败',
        });
    }
});
/**
 * 生成加密密钥（仅管理员）
 * POST /api/security/generate-key
 */
router.post('/generate-key', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin' && user.role !== 'platform_admin') {
            return res.status(403).json({
                success: false,
                message: '无权生成密钥',
            });
        }
        const key = encryptionService_1.default.generateKey();
        res.json({
            success: true,
            data: {
                key,
                message: '请将此密钥保存到环境变量 ENCRYPTION_KEY_DEFAULT 中',
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate key:', error);
        res.status(500).json({
            success: false,
            message: '生成密钥失败',
        });
    }
});
/**
 * 申请解锁联系方式
 * POST /api/security/unlock-contact/request
 */
router.post('/unlock-contact/request', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { studentId, companyId, taskId } = req.body;
        // 权限检查：只能申请自己相关的解锁
        if (user.role === 'student' && user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权申请此解锁',
            });
        }
        if (user.role === 'company' && user.id !== companyId) {
            return res.status(403).json({
                success: false,
                message: '无权申请此解锁',
            });
        }
        const result = await contactUnlockService_1.default.requestUnlock({
            studentId,
            companyId,
            taskId,
            requestedBy: user.role,
        });
        res.json({
            success: true,
            data: result,
            message: result.exchanged ? '联系方式已解锁' : '申请已发送，等待对方确认',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to request unlock:', error);
        res.status(400).json({
            success: false,
            message: error.message || '申请解锁失败',
        });
    }
});
/**
 * 同意解锁申请
 * POST /api/security/unlock-contact/approve
 */
router.post('/unlock-contact/approve', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { studentId, companyId } = req.body;
        // 权限检查
        if (user.role === 'student' && user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权同意此解锁',
            });
        }
        if (user.role === 'company' && user.id !== companyId) {
            return res.status(403).json({
                success: false,
                message: '无权同意此解锁',
            });
        }
        const result = await contactUnlockService_1.default.approveUnlock(studentId, companyId, user.role);
        res.json({
            success: true,
            data: result,
            message: result.exchanged ? '联系方式已解锁' : '已同意，等待对方确认',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to approve unlock:', error);
        res.status(400).json({
            success: false,
            message: error.message || '同意解锁失败',
        });
    }
});
/**
 * 拒绝解锁申请
 * POST /api/security/unlock-contact/reject
 */
router.post('/unlock-contact/reject', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { studentId, companyId } = req.body;
        // 权限检查
        if (user.role === 'student' && user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权拒绝此解锁',
            });
        }
        if (user.role === 'company' && user.id !== companyId) {
            return res.status(403).json({
                success: false,
                message: '无权拒绝此解锁',
            });
        }
        await contactUnlockService_1.default.rejectUnlock(studentId, companyId, user.role);
        res.json({
            success: true,
            message: '已拒绝解锁申请',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to reject unlock:', error);
        res.status(400).json({
            success: false,
            message: error.message || '拒绝解锁失败',
        });
    }
});
/**
 * 获取已解锁的联系方式
 * GET /api/security/unlock-contact/:studentId/:companyId
 */
router.get('/unlock-contact/:studentId/:companyId', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { studentId, companyId } = req.params;
        // 权限检查
        if (user.role === 'student' && user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权查看此联系方式',
            });
        }
        if (user.role === 'company' && user.id !== companyId) {
            return res.status(403).json({
                success: false,
                message: '无权查看此联系方式',
            });
        }
        const contact = await contactUnlockService_1.default.getUnlockedContact(studentId, companyId, user.role, user.id);
        res.json({
            success: true,
            data: contact,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get unlocked contact:', error);
        res.status(400).json({
            success: false,
            message: error.message || '获取联系方式失败',
        });
    }
});
/**
 * 获取解锁状态
 * GET /api/security/unlock-status/:studentId/:companyId
 */
router.get('/unlock-status/:studentId/:companyId', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { studentId, companyId } = req.params;
        // 权限检查
        if (user.role === 'student' && user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: '无权查看此解锁状态',
            });
        }
        if (user.role === 'company' && user.id !== companyId) {
            return res.status(403).json({
                success: false,
                message: '无权查看此解锁状态',
            });
        }
        const status = await contactUnlockService_1.default.getUnlockStatus(studentId, companyId);
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get unlock status:', error);
        res.status(500).json({
            success: false,
            message: '获取解锁状态失败',
        });
    }
});
/**
 * 获取用户的所有解锁请求
 * GET /api/security/my-unlock-requests
 */
router.get('/my-unlock-requests', auth_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'student' && user.role !== 'company') {
            return res.status(403).json({
                success: false,
                message: '无权访问',
            });
        }
        const requests = await contactUnlockService_1.default.getUserUnlockRequests(user.id, user.role);
        res.json({
            success: true,
            data: requests,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get unlock requests:', error);
        res.status(500).json({
            success: false,
            message: '获取解锁请求失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=security.js.map