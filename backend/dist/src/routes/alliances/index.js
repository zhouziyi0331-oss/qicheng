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
/**
 * 联合体系统
 * POST /alliances/create                    — 创建联合体
 * POST /alliances/invite                    — 邀请成员加入联合体
 * POST /alliances/respond                   — 响应联合体邀请
 * GET  /alliances/student/:studentId        — 获取学生的联合体信息
 * GET  /alliances/:allianceId               — 获取联合体详情
 * POST /alliances/project                   — 创建联合体项目
 * GET  /alliances/invitations/:studentId    — 获取学生收到的联合体邀请
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// 所有路由都需要认证
router.use(auth_1.authenticate);
// 创建联合体
router.post('/create', controller.createAlliance);
// 邀请成员
router.post('/invite', controller.inviteMember);
// 响应邀请
router.post('/respond', controller.respondToInvitation);
// 获取学生的联合体
router.get('/student/:studentId', controller.getStudentAlliances);
// 获取联合体详情
router.get('/:allianceId', controller.getAllianceDetail);
// 创建项目
router.post('/project', controller.createProject);
// 获取邀请列表
router.get('/invitations/:studentId', controller.getInvitations);
exports.default = router;
//# sourceMappingURL=index.js.map