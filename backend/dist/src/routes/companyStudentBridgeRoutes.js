"use strict";
/**
 * Phase 3.3: 企业-学生端打通路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const companyStudentBridgeService_1 = __importDefault(require("../services/companyStudentBridgeService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 企业订阅学生成长
 * POST /api/v1/company-student-bridge/subscribe
 */
router.post('/subscribe', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const { studentId, subscriptionType, notificationPreferences } = req.body;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: '请指定学生ID'
            });
        }
        logger_1.default.info('[CompanyStudentBridge] 企业订阅学生', { companyId, studentId });
        const success = await companyStudentBridgeService_1.default.subscribeToStudent({
            companyId,
            studentId,
            subscriptionType,
            notificationPreferences
        });
        res.json({
            success,
            message: '订阅成功'
        });
    }
    catch (error) {
        logger_1.default.error('[CompanyStudentBridge] 订阅失败:', error);
        next(error);
    }
});
/**
 * 企业添加学生声誉标签
 * POST /api/v1/company-student-bridge/reputation-tag
 */
router.post('/reputation-tag', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const createdBy = req.user.userId;
        const { studentId, tagType, tagName, tagDescription, evidence, sourceTaskId, confidenceScore, isVisibleToStudent } = req.body;
        if (!studentId || !tagType || !tagName) {
            return res.status(400).json({
                success: false,
                message: '学生ID、标签类型和标签名称为必填项'
            });
        }
        logger_1.default.info('[CompanyStudentBridge] 添加声誉标签', {
            companyId,
            studentId,
            tagType
        });
        const tagId = await companyStudentBridgeService_1.default.addReputationTag({
            companyId,
            studentId,
            tagType,
            tagName,
            tagDescription,
            evidence,
            sourceTaskId,
            confidenceScore,
            isVisibleToStudent,
            createdBy
        });
        res.json({
            success: true,
            data: { tagId },
            message: '标签添加成功'
        });
    }
    catch (error) {
        logger_1.default.error('[CompanyStudentBridge] 添加标签失败:', error);
        next(error);
    }
});
/**
 * 企业获取成长通知
 * GET /api/v1/company-student-bridge/notifications
 */
router.get('/notifications', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const { unreadOnly, limit, offset } = req.query;
        logger_1.default.info('[CompanyStudentBridge] 获取成长通知', { companyId });
        const result = await companyStudentBridgeService_1.default.getCompanyNotifications({
            companyId,
            unreadOnly: unreadOnly === 'true',
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('[CompanyStudentBridge] 获取通知失败:', error);
        next(error);
    }
});
/**
 * 标记通知为已读
 * POST /api/v1/company-student-bridge/notifications/:notificationId/read
 */
router.post('/notifications/:notificationId/read', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res, next) => {
    try {
        const companyId = req.user.userId;
        const notificationId = parseInt(req.params.notificationId);
        logger_1.default.info('[CompanyStudentBridge] 标记通知已读', {
            companyId,
            notificationId
        });
        const success = await companyStudentBridgeService_1.default.markNotificationAsRead(notificationId, companyId);
        res.json({
            success,
            message: success ? '标记成功' : '通知不存在'
        });
    }
    catch (error) {
        logger_1.default.error('[CompanyStudentBridge] 标记已读失败:', error);
        next(error);
    }
});
/**
 * 学生获取自己的声誉标签
 * GET /api/v1/company-student-bridge/my-reputation
 */
router.get('/my-reputation', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const studentId = req.user.userId;
        logger_1.default.info('[CompanyStudentBridge] 学生获取声誉标签', { studentId });
        const tags = await companyStudentBridgeService_1.default.getStudentReputationTags(studentId);
        res.json({
            success: true,
            data: tags
        });
    }
    catch (error) {
        logger_1.default.error('[CompanyStudentBridge] 获取声誉标签失败:', error);
        next(error);
    }
});
/**
 * 学生获取自己的成长里程碑
 * GET /api/v1/company-student-bridge/my-milestones
 */
router.get('/my-milestones', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const studentId = req.user.userId;
        const { milestoneType, limit } = req.query;
        logger_1.default.info('[CompanyStudentBridge] 学生获取成长里程碑', { studentId });
        const milestones = await companyStudentBridgeService_1.default.getStudentMilestones({
            studentId,
            milestoneType: milestoneType,
            limit: limit ? parseInt(limit) : undefined
        });
        res.json({
            success: true,
            data: milestones
        });
    }
    catch (error) {
        logger_1.default.error('[CompanyStudentBridge] 获取里程碑失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=companyStudentBridgeRoutes.js.map