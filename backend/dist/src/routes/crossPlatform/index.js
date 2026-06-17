"use strict";
/**
 * 跨端打通路由
 * 企业端和学生端双向联动API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crossPlatformService_1 = __importDefault(require("../../services/crossPlatformService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
// C-01: 需求变更的实时匹配更新
router.post('/tasks/:taskId/requirement-change', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { old_requirements, new_requirements } = req.body;
        const userId = req.user?.userId;
        const result = await crossPlatformService_1.default.recordRequirementChange({
            task_id: taskId,
            changed_by: userId,
            old_requirements,
            new_requirements
        });
        res.json({
            success: true,
            data: result,
            message: `需求已更新，已通知${result.affected_students_count}名匹配学生`
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 学生端: 获取匹配更新通知
router.get('/students/:studentId/matching-updates', auth_1.authenticate, async (req, res) => {
    try {
        const { studentId } = req.params;
        const updates = await crossPlatformService_1.default.getMatchingUpdatesForStudent(studentId);
        res.json({ success: true, data: updates, count: updates.length });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// C-03: 企业端"等一个人"功能
router.post('/watch-student', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user?.userId;
        const { student_id, watch_condition, note } = req.body;
        const result = await crossPlatformService_1.default.setWatchStudent(String(companyId), student_id, watch_condition, note);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// C-05: 任务进度更新
router.post('/tasks/:taskId/progress', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const studentId = req.user?.userId;
        const { stage, progress_percentage, estimated_completion } = req.body;
        const result = await crossPlatformService_1.default.updateTaskProgress(taskId, String(studentId || ''), stage, progress_percentage, estimated_completion);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 企业端: 查看任务进度
router.get('/tasks/:taskId/progress', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const companyId = req.user?.userId;
        const progress = await crossPlatformService_1.default.getTaskProgress(taskId, String(companyId || ''));
        res.json({ success: true, data: progress });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// C-09: 企业关注学生
router.post('/follow-student', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user?.userId;
        const { student_id, reason, source } = req.body;
        const result = await crossPlatformService_1.default.followStudent(String(companyId || ''), student_id, reason, source);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 企业端: 获取关注的学生动态
router.get('/followed-students-updates', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user?.userId;
        const updates = await crossPlatformService_1.default.getFollowedStudentsUpdates(String(companyId || ''));
        res.json({ success: true, data: updates });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 学生端: 获取我的关注者
router.get('/my-followers', auth_1.authenticate, async (req, res) => {
    try {
        const studentId = req.user?.userId;
        const followers = await crossPlatformService_1.default.getStudentFollowers(String(studentId || ''));
        res.json({ success: true, data: followers, count: followers.length });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// C-08: 双向评价
router.post('/tasks/:taskId/mutual-rating', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const result = await crossPlatformService_1.default.createMutualRating({
            task_id: taskId,
            ...req.body
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 获取关系标签
router.get('/relationship-badges', auth_1.authenticate, async (req, res) => {
    try {
        const { company_id, student_id } = req.query;
        const badges = await crossPlatformService_1.default.getRelationshipBadges(company_id, student_id);
        res.json({ success: true, data: badges });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// 学生端: 添加创作说明
router.post('/tasks/:taskId/creation-notes', auth_1.authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const studentId = req.user?.userId;
        const result = await crossPlatformService_1.default.addCreationNotes({
            task_id: taskId,
            student_id: studentId,
            ...req.body
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map