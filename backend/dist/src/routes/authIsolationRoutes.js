"use strict";
/**
 * 账号隔离和赛道选择路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const authIsolationController_1 = require("../controllers/authIsolationController");
const trackSelectionController_1 = require("../controllers/trackSelectionController");
const auth_1 = require("../middleware/auth");
const accountTypeMiddleware_1 = require("../middleware/accountTypeMiddleware");
const router = express_1.default.Router();
// ============================================================
// 账号隔离 - 注册接口
// ============================================================
/**
 * 学生注册
 * POST /api/v1/auth/register/student
 */
router.post('/register/student', [
    (0, express_validator_1.body)('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    (0, express_validator_1.body)('sms_code').isLength({ min: 4, max: 6 }).withMessage('请输入验证码'),
    (0, express_validator_1.body)('nickname').notEmpty().withMessage('请输入昵称'),
    validate_1.validate
], authIsolationController_1.registerStudent);
/**
 * 企业注册
 * POST /api/v1/auth/register/enterprise
 */
router.post('/register/enterprise', [
    (0, express_validator_1.body)('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    (0, express_validator_1.body)('sms_code').isLength({ min: 4, max: 6 }).withMessage('请输入验证码'),
    (0, express_validator_1.body)('company_name').notEmpty().withMessage('请输入企业名称'),
    (0, express_validator_1.body)('contact_name').notEmpty().withMessage('请输入联系人姓名'),
    validate_1.validate
], authIsolationController_1.registerEnterprise);
// ============================================================
// 账号隔离 - 登录接口
// ============================================================
/**
 * 学生登录
 * POST /api/v1/auth/login/student
 */
router.post('/login/student', [
    (0, express_validator_1.body)('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('请输入密码'),
    validate_1.validate
], authIsolationController_1.loginStudent);
/**
 * 企业登录
 * POST /api/v1/auth/login/enterprise
 */
router.post('/login/enterprise', [
    (0, express_validator_1.body)('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('请输入密码'),
    validate_1.validate
], authIsolationController_1.loginEnterprise);
// ============================================================
// 赛道选择接口 (需要学生账号认证)
// ============================================================
/**
 * 获取赛道推荐
 * GET /api/v1/students/track-recommendation
 */
router.get('/students/track-recommendation', auth_1.authenticate, accountTypeMiddleware_1.requireStudentAccount, trackSelectionController_1.getTrackRecommendation);
/**
 * 选择赛道
 * POST /api/v1/students/select-track
 */
router.post('/students/select-track', auth_1.authenticate, accountTypeMiddleware_1.requireStudentAccount, [
    (0, express_validator_1.body)('track').isIn(['content', 'dev']).withMessage('赛道类型必须是 content 或 dev'),
    validate_1.validate
], trackSelectionController_1.selectTrack);
/**
 * 获取赛道路径对比
 * GET /api/v1/students/track-paths
 */
router.get('/students/track-paths', auth_1.authenticate, accountTypeMiddleware_1.requireStudentAccount, trackSelectionController_1.getTrackPaths);
/**
 * 获取我的赛道信息
 * GET /api/v1/students/my-track
 */
router.get('/students/my-track', auth_1.authenticate, accountTypeMiddleware_1.requireStudentAccount, trackSelectionController_1.getMyTrack);
exports.default = router;
//# sourceMappingURL=authIsolationRoutes.js.map