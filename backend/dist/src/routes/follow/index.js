"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("../../utils/logger"));
const followService_1 = __importDefault(require("../../services/followService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/follow/student
 * 关注学生
 */
router.post('/student', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以关注学生',
            });
        }
        const { studentId, follow_source, follow_reason, tags, notes } = req.body;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: studentId',
            });
        }
        const follow = await followService_1.default.followStudent({
            company_id: companyId,
            student_id: studentId,
            follow_source,
            follow_reason,
            tags,
            notes,
        });
        res.json({
            success: true,
            data: follow,
            message: '关注成功',
        });
    }
    catch (error) {
        logger_1.default.error('关注学生失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '关注学生失败',
        });
    }
});
/**
 * DELETE /api/follow/student/:studentId
 * 取消关注学生
 */
router.delete('/student/:studentId', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { studentId } = req.params;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以取消关注',
            });
        }
        await followService_1.default.unfollowStudent(companyId, studentId);
        res.json({
            success: true,
            message: '取消关注成功',
        });
    }
    catch (error) {
        logger_1.default.error('取消关注失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '取消关注失败',
        });
    }
});
/**
 * GET /api/follow/student/:studentId/status
 * 检查是否关注某学生
 */
router.get('/student/:studentId/status', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { studentId } = req.params;
        const isFollowing = await followService_1.default.isFollowing(companyId, studentId);
        res.json({
            success: true,
            data: { is_following: isFollowing },
        });
    }
    catch (error) {
        logger_1.default.error('检查关注状态失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '检查关注状态失败',
        });
    }
});
/**
 * GET /api/follow/following
 * 获取企业关注的学生列表
 */
router.get('/following', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { limit, offset } = req.query;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看关注列表',
            });
        }
        const students = await followService_1.default.getFollowingStudents(companyId, limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);
        res.json({
            success: true,
            data: {
                students,
                total: students.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取关注列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取关注列表失败',
        });
    }
});
/**
 * GET /api/follow/followers
 * 获取学生的粉丝列表（学生查看谁关注了我）
 */
router.get('/followers', auth_1.authenticate, async (req, res) => {
    try {
        const studentId = req.user.id;
        const userRole = req.user.role;
        const { limit, offset } = req.query;
        if (userRole !== 'student') {
            return res.status(403).json({
                success: false,
                message: '只有学生可以查看粉丝列表',
            });
        }
        const followers = await followService_1.default.getFollowers(studentId, limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);
        res.json({
            success: true,
            data: {
                followers,
                total: followers.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取粉丝列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取粉丝列表失败',
        });
    }
});
/**
 * PUT /api/follow/student/:studentId/settings
 * 更新关注设置
 */
router.put('/student/:studentId/settings', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { studentId } = req.params;
        const follow = await followService_1.default.updateFollowSettings(companyId, studentId, req.body);
        res.json({
            success: true,
            data: follow,
            message: '设置更新成功',
        });
    }
    catch (error) {
        logger_1.default.error('更新关注设置失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新关注设置失败',
        });
    }
});
/**
 * GET /api/follow/activities/feed
 * 获取关注学生的动态流
 */
router.get('/activities/feed', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { limit } = req.query;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看动态流',
            });
        }
        const activities = await followService_1.default.getFollowingActivitiesFeed(companyId, limit ? parseInt(limit, 10) : 30);
        res.json({
            success: true,
            data: {
                activities,
                total: activities.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取动态流失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取动态流失败',
        });
    }
});
/**
 * GET /api/follow/activities/student/:studentId
 * 获取某学生的动态
 */
router.get('/activities/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { limit, offset } = req.query;
        const activities = await followService_1.default.getStudentActivities(studentId, limit ? parseInt(limit, 10) : 20, offset ? parseInt(offset, 10) : 0);
        res.json({
            success: true,
            data: {
                activities,
                total: activities.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取学生动态失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取学生动态失败',
        });
    }
});
/**
 * GET /api/follow/notifications
 * 获取关注通知
 */
router.get('/notifications', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { limit, offset } = req.query;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看通知',
            });
        }
        const notifications = await followService_1.default.getFollowNotifications(companyId, limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);
        res.json({
            success: true,
            data: {
                notifications,
                total: notifications.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取通知失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取通知失败',
        });
    }
});
/**
 * POST /api/follow/notifications/:id/read
 * 标记通知已读
 */
router.post('/notifications/:id/read', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        await followService_1.default.markNotificationAsRead(id, companyId);
        res.json({
            success: true,
            message: '已标记为已读',
        });
    }
    catch (error) {
        logger_1.default.error('标记已读失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '标记已读失败',
        });
    }
});
/**
 * POST /api/follow/notifications/read-all
 * 标记所有通知已读
 */
router.post('/notifications/read-all', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        await followService_1.default.markAllNotificationsAsRead(companyId);
        res.json({
            success: true,
            message: '所有通知已标记为已读',
        });
    }
    catch (error) {
        logger_1.default.error('标记所有已读失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '标记所有已读失败',
        });
    }
});
/**
 * GET /api/follow/notifications/unread-count
 * 获取未读通知数
 */
router.get('/notifications/unread-count', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const count = await followService_1.default.getUnreadNotificationCount(companyId);
        res.json({
            success: true,
            data: { unread_count: count },
        });
    }
    catch (error) {
        logger_1.default.error('获取未读数失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取未读数失败',
        });
    }
});
/**
 * POST /api/follow/collections
 * 创建收藏夹
 */
router.post('/collections', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { name, description, color } = req.body;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以创建收藏夹',
            });
        }
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: name',
            });
        }
        const collection = await followService_1.default.createCollection({
            company_id: companyId,
            name,
            description,
            color,
        });
        res.json({
            success: true,
            data: collection,
            message: '收藏夹创建成功',
        });
    }
    catch (error) {
        logger_1.default.error('创建收藏夹失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建收藏夹失败',
        });
    }
});
/**
 * GET /api/follow/collections
 * 获取收藏夹列表
 */
router.get('/collections', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看收藏夹',
            });
        }
        const collections = await followService_1.default.getCollections(companyId);
        res.json({
            success: true,
            data: {
                collections,
                total: collections.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取收藏夹列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取收藏夹列表失败',
        });
    }
});
/**
 * PUT /api/follow/collections/:id
 * 更新收藏夹
 */
router.put('/collections/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const collection = await followService_1.default.updateCollection(id, req.body);
        res.json({
            success: true,
            data: collection,
            message: '收藏夹更新成功',
        });
    }
    catch (error) {
        logger_1.default.error('更新收藏夹失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新收藏夹失败',
        });
    }
});
/**
 * DELETE /api/follow/collections/:id
 * 删除收藏夹
 */
router.delete('/collections/:id', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const { id } = req.params;
        await followService_1.default.deleteCollection(id, companyId);
        res.json({
            success: true,
            message: '收藏夹删除成功',
        });
    }
    catch (error) {
        logger_1.default.error('删除收藏夹失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除收藏夹失败',
        });
    }
});
/**
 * POST /api/follow/collections/:id/students
 * 将学生添加到收藏夹
 */
router.post('/collections/:id/students', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: studentId',
            });
        }
        await followService_1.default.addStudentToCollection(id, studentId);
        res.json({
            success: true,
            message: '学生添加成功',
        });
    }
    catch (error) {
        logger_1.default.error('添加学生到收藏夹失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '添加学生到收藏夹失败',
        });
    }
});
/**
 * DELETE /api/follow/collections/:id/students/:studentId
 * 从收藏夹移除学生
 */
router.delete('/collections/:id/students/:studentId', auth_1.authenticate, async (req, res) => {
    try {
        const { id, studentId } = req.params;
        await followService_1.default.removeStudentFromCollection(id, studentId);
        res.json({
            success: true,
            message: '学生移除成功',
        });
    }
    catch (error) {
        logger_1.default.error('移除学生失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '移除学生失败',
        });
    }
});
/**
 * GET /api/follow/collections/:id/students
 * 获取收藏夹中的学生
 */
router.get('/collections/:id/students', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const students = await followService_1.default.getCollectionStudents(id);
        res.json({
            success: true,
            data: {
                students,
                total: students.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取收藏夹学生失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取收藏夹学生失败',
        });
    }
});
/**
 * GET /api/follow/stats
 * 获取关注统计
 */
router.get('/stats', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看统计',
            });
        }
        const stats = await followService_1.default.getFollowStats(companyId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error('获取关注统计失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取关注统计失败',
        });
    }
});
/**
 * GET /api/follow/recommended
 * 获取推荐关注的学生
 */
router.get('/recommended', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { limit } = req.query;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看推荐',
            });
        }
        const students = await followService_1.default.getRecommendedStudents(companyId, limit ? parseInt(limit, 10) : 10);
        res.json({
            success: true,
            data: {
                students,
                total: students.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('获取推荐学生失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取推荐学生失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map