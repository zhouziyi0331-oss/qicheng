"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// ============================================================
// 创建团队任务
// ============================================================
router.post('/create', [
    (0, express_validator_1.body)('taskId').isUUID().withMessage('任务ID格式错误'),
    (0, express_validator_1.body)('maxMembers').optional().isInt({ min: 2, max: 10 }).withMessage('团队人数必须在2-10人之间'),
], controller.createTeam);
// ============================================================
// 邀请成员加入团队
// ============================================================
router.post('/:id/invite', [
    (0, express_validator_1.param)('id').isUUID().withMessage('团队ID格式错误'),
    (0, express_validator_1.body)('studentId').isUUID().withMessage('学生ID格式错误'),
], controller.inviteMember);
// ============================================================
// 获取团队详情
// ============================================================
router.get('/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('团队ID格式错误')], controller.getTeamDetail);
// ============================================================
// 开始团队任务
// ============================================================
router.post('/:id/start', [(0, express_validator_1.param)('id').isUUID().withMessage('团队ID格式错误')], controller.startTeamTask);
// ============================================================
// 完成团队任务并分配收益
// ============================================================
router.post('/:id/complete', [
    (0, express_validator_1.param)('id').isUUID().withMessage('团队ID格式错误'),
    (0, express_validator_1.body)('contributions').isObject().withMessage('贡献度必须是对象'),
], controller.completeTeamTask);
// ============================================================
// 获取我的团队列表
// ============================================================
router.get('/my', controller.getMyTeams);
exports.default = router;
//# sourceMappingURL=index.js.map